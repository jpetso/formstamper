import { app, BrowserWindow, ipcMain } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { enableLiveReload } from 'electron-compile';
import fixPath from 'fix-path';
import commandExists from 'command-exists';
import systeminformation from 'systeminformation';
import fs from 'fs';
import parse from 'csv-parse';
import pdfjsLib from 'pdfjs-dist';
import pdftk from 'node-pdftk';
import Canvas from 'canvas';
import assert from 'assert';

// Try to fix process.env.PATH on macOS, given command-exist's reliance on it.
fixPath();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Keep the actual CSV data with the main process, as global state.
// It will be updated on receiving a 'load-csv' event.
let csvRows = [];

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload({ strategy: 'react-hmr' });

const createWindow = async () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  if (isDevMode) {
    await installExtension(REACT_DEVELOPER_TOOLS);
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('configure-system-requirements', (event, options) => {
  // The options parameter is currently unused.
  // In the future, it could be used to supply custom
  // executable paths or particular settings.

  const allPromises = [];
  const status = {
    isUsable: false,
    os: {},
    details: {},
  };

  allPromises.push(systeminformation.osInfo().then((osinfo) => {
    status.os = {
      platform: osinfo.platform, // 'linux', 'darwin', 'windows'
      distro: osinfo.distro, // e.g. 'Arch'
      build: osinfo.build,
      arch: osinfo.arch,
    };
    console.log('OS info:');
    console.log(status.os);
  }).catch((error) => {
    console.log('Couldn\'t retrieve OS info.');
    status.os = {};
  }));

  allPromises.push(commandExists('pdftk').then((result) => {
    status.details.pdftk = {
      isUsable: true,
    };
    console.log('pdftk: command exists');
  }).catch(() => {
    console.log('pdftk: command doesn\'t exist');
    status.details.pdftk = {
      isUsable: false,
    };
  }));

  Promise.all(allPromises).then(() => {
    status.isUsable = status.details.pdftk.isUsable;
    console.log(`Runtime requirements satisfied: ${status.isUsable}`);
    event.sender.send('system-requirements-status', status);
  });
});

function replaceOutputPathTokens(outputPathTemplate, outputPathReplacements, row) {
  const replacementStringPairs = {};

  for (const replacedString in outputPathReplacements) {
    replacementStringPairs[replacedString] =
        outputPathReplacements[replacedString].reduce((replacementString, mapping) => {
          if (mapping.source === 'table' && mapping.columnNumber <= row.length) {
            return replacementString + row[mapping.columnNumber - 1];
          }
          else if (mapping.source === 'text') {
            return replacementString + mapping.text;
          }
          return `${replacementString}@@@`;
        }, '');
  }

  let outputPath = outputPathTemplate;

  for (const replaced in replacementStringPairs) {
    outputPath = outputPath.replace(replaced, replacementStringPairs[replaced]);
  }

  return outputPath;
}

ipcMain.on('generate-pdfs', (event, pdfTemplatePath, pdfOutputPathTemplate, fieldMappings) => {
  /* e.g.
    fieldMappings = [
      {
        fieldName: 'TR_NUMBER',
        mapping: {
          source: 'table',
          columnNumber: 2,
        }
      },
      {
        fieldName: 'PROVINCE',
        mapping: {
          source: 'text',
          text: 'ON',
        }
      }
    ];
  */

  console.log(`PDF: ${pdfTemplatePath}`);
  console.log(`Path template: ${pdfOutputPathTemplate}`);

  const pdfOutputPathReplacements = {};
  {
    const pdfFieldNameRegex = /{@\S+}/g;
    const csvColumnNumberRegex = /{#[0-9]+}/g;

    const fieldNameReplacements = fieldMappings.reduce((replacements, mapping) => {
      replacements[`{@${mapping.fieldName}}`] = [mapping.mapping];
      return replacements;
    }, {});

    (pdfOutputPathTemplate.match(pdfFieldNameRegex) || []).forEach(function (match) {
      if (fieldNameReplacements[match] !== undefined) {
        pdfOutputPathReplacements[match] = fieldNameReplacements[match];
      }
    });

    (pdfOutputPathTemplate.match(csvColumnNumberRegex) || []).forEach(function (match) {
      pdfOutputPathReplacements[match] = [{
        source: 'table',
        columnNumber: parseInt(match.substr(2, match.length - 1), 10), // exclude '{#' and '}'
      }];
    });
  }

  console.log('Path template replacements: ');
  console.log(pdfOutputPathReplacements);

  const generatedPdfs = [];
  const errors = [];
  const skipRows = 1;

  let pdftkPromises = [];

  csvRows.forEach((row, index) => {
    if (index < skipRows) {
      return;
    }
    const rowNumber = index + 1;

    const concreteMappings = fieldMappings.reduce((filledFormFields, fieldMapping) => {
      if (fieldMapping.mapping.source === 'table'
          && fieldMapping.mapping.columnNumber <= row.length)
      {
        filledFormFields[fieldMapping.fieldName] =
            row[fieldMapping.mapping.columnNumber - 1];
      }
      else if (fieldMapping.mapping.source === 'text') {
        filledFormFields[fieldMapping.fieldName] = fieldMapping.mapping.text;
      }
      return filledFormFields;
    }, {});

    const pdfOutputPath = replaceOutputPathTokens(
        pdfOutputPathTemplate, pdfOutputPathReplacements, row);

    console.log(`Storing PDF for row #${rowNumber} as ${pdfOutputPath}.`);
    console.log(concreteMappings);

    pdftkPromises.push(pdftk.input(pdfTemplatePath)
        .fillForm(concreteMappings)
        .flatten()
        .output()
        .then((buffer) => {
          fs.writeFile(pdfOutputPath, buffer, function (err) {
            if (err) {
              throw err;
            }
            generatedPdfs.push({
              pdfOutputPath,
              rowNumber,
            });
            console.log(`Stored PDF for row #${rowNumber} as ${pdfOutputPath}`);
          });
        })
        .catch((err) => {
          errors.push({
            pdfOutputPath,
            type: 'Exception',
            name: err.name,
            message: err.message,
            rowNumber,
            row,
          });
          console.log(`Error: ${err.name}: ${err.message}`);
        }));
  });

  Promise.all(pdftkPromises).then(() => {
    event.sender.send('pdf-generation-finished', generatedPdfs, errors);
  });
});

ipcMain.on('load-pdf-template', (event, pdfTemplatePath) => {
  console.log(`Loading PDF template: ${pdfTemplatePath}`);

  const rawData = new Uint8Array(fs.readFileSync(pdfTemplatePath));
  const loadingTask = pdfjsLib.getDocument(rawData);

  function NodeCanvasFactory() {}
  NodeCanvasFactory.prototype = {
    create: function NodeCanvasFactory_create(width, height) {
      assert(width > 0 && height > 0, 'Invalid canvas size');
      const canvas = Canvas.createCanvas(width, height);
      const context = canvas.getContext('2d');
      return {
        canvas,
        context,
      };
    },

    reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
      assert(canvasAndContext.canvas, 'Canvas is not specified');
      assert(width > 0 && height > 0, 'Invalid canvas size');
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    },

    destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
      assert(canvasAndContext.canvas, 'Canvas is not specified');

      // Zeroing the width and height cause Firefox to release graphics
      // resources immediately, which can greatly reduce memory consumption.
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    },
  };

  loadingTask.promise.then(function (pdfDocument) {
    console.log('# PDF document loaded.');

    const pagePromises = [];
    const annotationPromises = [];
    const fieldsByName = {};
    const fieldNames = [];

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      pagePromises.push(pdfDocument.getPage(i).then((page) => {
        annotationPromises.push(page.getAnnotations().then((annotations) => {
          annotations.forEach((ann) => {
            if (ann.subtype !== 'Widget' || ann.readOnly) {
              return;
            }
            if (fieldsByName[ann.fieldName] !== undefined) {
              return;
            }
            if (ann.fieldType === 'Tx') {
              fieldsByName[ann.fieldName] = {
                fieldName: ann.fieldName,
                fieldType: 'Text',
                fieldValue: ann.fieldValue,
                multiLine: ann.multiLine,
                maxLength: ann.maxLen,
              };
              fieldNames.push(ann.fieldName);
            }
          });
        }));

        // Render the page on a Node canvas with 100% scale.
        const viewport = page.getViewport(1.0);
        const canvasFactory = new NodeCanvasFactory();
        const canvasAndContext =
            canvasFactory.create(viewport.width, viewport.height);
        const renderContext = {
          canvasContext: canvasAndContext.context,
          viewport,
          canvasFactory,
        };

        const renderTask = page.render(renderContext);
        renderTask.promise.then(() => {
          // Convert the canvas to an image buffer.
          const image = canvasAndContext.canvas.toDataURL('image/png');
          event.sender.send('pdf-preview-updated', pdfTemplatePath, image);
        });
      }));
    }
    Promise.all(pagePromises).then(() => {
      Promise.all(annotationPromises).then(() => {
        event.sender.send('pdf-fields-available', pdfTemplatePath,
            fieldNames.reduce((fields, fieldName) => {
              fields.push(fieldsByName[fieldName]);
              return fields;
            }, []));
      });
    });
  }).catch(function (reason) {
    console.log(reason);
  });
});

ipcMain.on('load-csv', (event, csvPath) => {
  let context = this;
  let rows = [];
  let filestream = fs.createReadStream(csvPath)
    .pipe(parse())
    .on('data', function (row) {
      rows.push(row);
    })
    .on('error', function (err) {
      dialog.showErrorBox(`CSV loading error${err.message}`);
    })
    .on('end', function () {
      const fields = rows[0].map((field, index) => ({
        columnNumber: index + 1,
        fieldName: field,
      }));
      csvRows = rows;
      event.sender.send('csv-fields-available', csvPath, fields);
    });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

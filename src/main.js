import console from 'console';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import fixPath from 'fix-path';
import commandExists from 'command-exists';
import systeminformation from 'systeminformation';
import fs from 'fs';
import parse from 'csv-parse';
import pdftk from 'node-pdftk';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  installExtension(REACT_DEVELOPER_TOOLS);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Try to fix process.env.PATH on macOS, given command-exist's reliance on it.
fixPath();

// Keep the actual CSV data with the main process, as global state.
// It will be updated on receiving a 'load-csv' event.
let csvRows = [];

ipcMain.on('configure-system-requirements', (event) => {
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
    console.log(error);
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

  Object.keys(outputPathReplacements).forEach((replacedString) => {
    replacementStringPairs[replacedString] =
        outputPathReplacements[replacedString].reduce((replacementString, mapping) => {
          if (mapping.source === 'table' && mapping.columnNumber <= row.length) {
            return replacementString + row[mapping.columnNumber - 1];
          }
          if (mapping.source === 'text') {
            return replacementString + mapping.text;
          }
          return `${replacementString}@@@`;
        }, '');
  });

  let outputPath = outputPathTemplate;

  Object.keys(replacementStringPairs).forEach((replaced) => {
    outputPath = outputPath.replace(replaced, replacementStringPairs[replaced]);
  });

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

    (pdfOutputPathTemplate.match(pdfFieldNameRegex) || []).forEach((match) => {
      if (fieldNameReplacements[match] !== undefined) {
        pdfOutputPathReplacements[match] = fieldNameReplacements[match];
      }
    });

    (pdfOutputPathTemplate.match(csvColumnNumberRegex) || []).forEach((match) => {
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
  const pdftkPromises = [];

  csvRows.forEach((row, index) => {
    if (index < skipRows) {
      return;
    }
    const rowNumber = index + 1;

    const concreteMappings = fieldMappings.reduce((filledFormFields, fieldMapping) => {
      if (fieldMapping.mapping.source === 'table'
        && fieldMapping.mapping.columnNumber <= row.length
      ) {
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
        fs.writeFile(pdfOutputPath, buffer, (err) => {
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

  pdftk.input(pdfTemplatePath)
    .readFormFieldValuesAsJSON()
    .then((fieldValues) => {
      const fields = Array.from(Object.entries(fieldValues), (fieldValue) => {
        const [name, value] = fieldValue;
        return {
          fieldName: name,
          fieldType: 'Text', // FIXME: this is an assumption, use dump_data_fields_utf8 to get real info
          fieldValue: value,
          // Fields that pdf.js provided but pdftk less so:
          // multiLine: ann.multiLine,
          // maxLength: ann.maxLen,
        };
      });
      event.sender.send('pdf-fields-available', pdfTemplatePath, fields);

      pdftk.input(pdfTemplatePath)
        .fillForm(fieldValues)
        .flatten()
        .output()
        .then((pdfData) => {
          event.sender.send('pdf-preview-updated', pdfTemplatePath,
            `data:application/pdf;base64,${pdfData.toString('base64')}`);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

ipcMain.on('load-csv', (event, csvPath) => {
  const rows = [];

  fs.createReadStream(csvPath)
    .pipe(parse())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('error', (err) => {
      dialog.showErrorBox(`CSV loading error${err.message}`);
    })
    .on('end', () => {
      const fields = rows[0].map((field, index) => ({
        columnNumber: index + 1,
        fieldName: field,
      }));
      csvRows = rows;
      event.sender.send('csv-fields-available', csvPath, fields);
    });
});

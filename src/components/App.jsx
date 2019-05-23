import React from 'react';
import { remote, ipcRenderer } from 'electron';
import path from 'path';
import VLHeader from './VLHeader';
import VLButton from './VLButton';
import VLAvailableFields from './VLAvailableFields';

const { dialog } = remote;
const TABLE = 'table';
const TEXT = 'text';
const WIDTH_OF_COLUMN = '15em';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.onGeneratePDFs = this.onGeneratePDFs.bind(this);
    this.setFieldMapping = this.setFieldMapping.bind(this);
    this.state = {
      systemRequirementsStatus: {},
      pdfFields: [],
      csvFields: [],
      previewSrc: '',
      pdfTemplatePath: '',
      fieldMappings: [],
      availableFieldsState: [],
    };

    const mapPdfFieldsToAvailableFields = element => ({
      canEdit: true,
      isEditingCustomValue: false,
      fieldValue: element.fieldValue,
      selectedIndex: 0,
    });

    ipcRenderer.on('system-requirements-status', (event, status) => {
      this.setState({
        systemRequirementsStatus: status,
      });
    });

    ipcRenderer.on('pdf-fields-available', (event, pdfTemplatePath, fields) => {
      this.setState({
        pdfFields: fields,
        pdfTemplatePath,
        fieldMappings: [],
        availableFieldsState: fields.map(mapPdfFieldsToAvailableFields),
      });
    });

    ipcRenderer.on('csv-fields-available', (event, csvPath, fields) => {
      this.setState(prevState => ({
        csvFields: fields,
        fieldMappings: [],
        availableFieldsState: prevState.pdfFields.map(mapPdfFieldsToAvailableFields),
      }));
    });

    ipcRenderer.on('pdf-preview-updated', (event, pdfTemplatePath, imgsrc) => {
      this.setState({ previewSrc: imgsrc });
    });

    ipcRenderer.send('configure-system-requirements');
  }

  static onLoadPDFFile() {
    const filenames = dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'PDF files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (!Array.isArray(filenames) || filenames.length !== 1) {
      return;
    }

    ipcRenderer.send('load-pdf-template', filenames[0]);
  }

  static onLoadCSVFile() {
    const filenames = dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'CSV files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (!Array.isArray(filenames) || filenames.length !== 1) {
      return;
    }

    ipcRenderer.send('load-csv', filenames[0]);
  }

  onGeneratePDFs() {
    const dirnames = dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (!Array.isArray(dirnames) || dirnames.length !== 1) {
      return;
    }

    ipcRenderer.send('generate-pdfs', this.state.pdfTemplatePath,
        `${dirnames[0]}${path.sep}Tax Receipt {@TR_NUMBER} - {@NAME}.pdf`,
        this.state.fieldMappings.filter(element => typeof element !== 'undefined'));
  }

  setFieldMapping(index, updates) {
    this.setState((prevState) => {
      const fieldUpdates = {};
      fieldUpdates.availableFieldsState = prevState.availableFieldsState.map(
        (element, i) => ((i === index)
          ? Object.assign({}, element, updates.state)
          : element),
      );
      if (typeof updates.selectedIndex !== 'undefined') {
        const csvFieldValue = (updates.selectedIndex === 0)
          ? prevState.availableFieldsState[index].fieldValue
          : updates.selectedIndex;
        fieldUpdates.fieldMappings = [...prevState.fieldMappings];
        fieldUpdates.fieldMappings[index] = (csvFieldValue === '')
          ? undefined
          : {
            fieldName: prevState.pdfFields[index].fieldName,
            mapping: updates.selectedIndex === 0
              ? {
                source: TEXT,
                text: csvFieldValue,
              }
              : {
                source: TABLE,
                columnNumber: csvFieldValue,
              },
          };
      }
      return fieldUpdates;
    });
  }

  render() {
    const appStyle = {
      display: 'grid',
      gridTemplateColumns: `${WIDTH_OF_COLUMN} ${WIDTH_OF_COLUMN} 1fr`,
      gridTemplateRows: '1fr 9fr',
      height: '10em',
    };

    return (<div>
      <VLHeader />
      <div style={appStyle}>
        <VLButton
          value={'Load PDF template'}
          onClick={App.onLoadPDFFile}
          disabledButton={false}
        />
        <VLButton
          value={'Load CSV table'}
          onClick={App.onLoadCSVFile}
          disabledButton={this.state.pdfFields.length === 0}
        />
        <VLButton
          value={'Select output folder'}
          onClick={this.onGeneratePDFs}
          disabledButton={this.state.pdfTemplatePath === '' || this.state.csvFields.length === 0}
        />

        <VLAvailableFields
          systemRequirementsStatus={this.state.systemRequirementsStatus}
          csvFields={this.state.csvFields}
          pdfFields={this.state.pdfFields}
          width={WIDTH_OF_COLUMN}
          setFieldMapping={this.setFieldMapping}
          availableFieldsState={this.state.availableFieldsState}
        />

        <div>
          {this.state.previewSrc
            ? <img
              alt="Preview of PDFs generated upon completion"
              id="pdf-preview"
              src={this.state.previewSrc}
            />
            : <div style={{ fontSize: '10em' }}>
              3
            </div>
          }
        </div>
      </div>
    </div>);
  }
}

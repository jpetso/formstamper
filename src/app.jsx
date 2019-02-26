import React from 'react'
import { remote, ipcRenderer } from 'electron'

const { dialog } = remote
const EMPTY = "<empty>"
const TABLE = "table"
const TEXT = "text"

class VLHeader extends React.Component {
  render() {
    return (
      <h2>Filling PDF form fields</h2>
    );
  }
}

class VLButton extends React.Component {
  render() {
    return (
      <button className="vl-button" onClick={this.props.onClick}>
        {this.props.value}
      </button>
    );
  }
}

class VLAvailableFields extends React.Component {
  render() {
    const options = this.props.csvFields.map(csvElement =>
      <option value={csvElement.fieldName}>{csvElement.fieldName}</option>)
    const csvFieldsDisplay = this.props.csvFields.length === 0 ? [] :
      this.props.pdfFields.map(pdfElement =>
        <select onChange={event =>
          this.props.fieldMappingHandler(
            event.target.value,
            pdfElement.fieldName,
            TABLE)}>
          <option value={EMPTY}>{EMPTY}</option>
          {options}
        </select>)
    const pdfFieldsDisplay = this.props.pdfFields.map(pdfElement =>
      <div>{pdfElement.fieldName}</div>)

    return (
      <div>
        <div>{pdfFieldsDisplay.length > 0 ?
          pdfFieldsDisplay :
          <div style={{"fontSize": "20em"}}>1</div>}
        </div>
        <div>{csvFieldsDisplay.length > 0 ?
          csvFieldsDisplay :
          <div style={{"fontSize": "20em"}}>2</div>}
        </div>
      </div>
    );
  }
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.onLoadCSVFile = this.onLoadCSVFile.bind(this)
    this.onLoadPDFFile = this.onLoadPDFFile.bind(this)
    this.resetFieldMappings = this.resetFieldMappings.bind(this)
    this.fieldMappingHandler = this.fieldMappingHandler.bind(this)
    this.state = {
      pdfFields: [],
      csvFields: [],
      previewSrc: "",
      fieldMappings: []
    }

    ipcRenderer.on('pdf-fields-available', (event, pdfTemplateFilename, fields) => {
      this.setState(this.resetFieldMappings(this.state.csvFields, fields))
    })

    ipcRenderer.on('csv-fields-available', (event, csvFilename, fields) => {
      this.setState(this.resetFieldMappings(fields, this.state.pdfFields))
    })

    ipcRenderer.on('pdf-preview-updated', (event, pdfTemplateFilename, imgsrc) => {
      this.setState({ previewSrc: imgsrc })
    })
  }

  resetFieldMappings(csvFields, pdfFields) {
    return {
      pdfFields: pdfFields,
      csvFields: csvFields,
      fieldMappings: []
    }
  }

  fieldMappingHandler(csvFieldName, pdfFieldName, mappingSource) {
    this.setState(previousState => {
      let fieldMappings = [...previousState.fieldMappings]
      let index = fieldMappings.findIndex(element =>
        element.fieldName === pdfFieldName)
      index = (index === -1) ? fieldMappings.length : index
      fieldMappings.splice(index, 1)

      const newEntry = csvFieldName === EMPTY ? [] :
        [{fieldName: pdfFieldName,
          mapping: {
            source: mappingSource,
            [mappingSource === TABLE ? "columnName" : "text"]: csvFieldName}
        }]

      return { fieldMappings: [...fieldMappings, ...newEntry] }
    })
  }

  onLoadPDFFile() {
    const filenames = dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'PDF files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (!Array.isArray(filenames) || filenames.length !== 1) {
      return
    }

    const canvas = document.getElementById('pdf-preview');
    ipcRenderer.send('load-pdf-template', filenames[0])
  }

  onLoadCSVFile() {
    const filenames = dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'CSV files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (!Array.isArray(filenames) || filenames.length !== 1) {
      return
    }

    ipcRenderer.send('load-csv', filenames[0])
  }

  render() {
    return (<div>
      <VLHeader />
      <VLButton value={"Load PDF template"} onClick={this.onLoadPDFFile} />
      <VLButton value={"Load CSV table"} onClick={this.onLoadCSVFile} />
      <VLButton value={"Generate PDFs in folder"} />

      <VLAvailableFields
        pdfFields={this.state.pdfFields}
        csvFields={this.state.csvFields}
        fieldMappingHandler={this.fieldMappingHandler}
      />

      <img id="pdf-preview" src={this.state.previewSrc} />
    </div>);
  }
}
// {this.state.fieldMappings.map(element => <div>{JSON.stringify(element)}</div>)}

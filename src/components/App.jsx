import React from 'react'
import { remote, ipcRenderer } from 'electron'
import VLHeader from './VLHeader'
import VLButton from './VLButton'
import VLAvailableFields from './VLAvailableFields'

const { dialog } = remote
const EMPTY = "<empty>"
const TABLE = "table"
const TEXT = "text"
const WIDTH_OF_COLUMN = '15em'

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.onLoadCSVFile = this.onLoadCSVFile.bind(this)
    this.onLoadPDFFile = this.onLoadPDFFile.bind(this)
    this.resetFieldMappings = this.resetFieldMappings.bind(this)
    this.onFieldMappingChange = this.onFieldMappingChange.bind(this)
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

  onFieldMappingChange(csvFieldName, pdfFieldName, mappingSource) {
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
    const appStyle = {
      display: 'grid',
      gridTemplateColumns: `${WIDTH_OF_COLUMN} ${WIDTH_OF_COLUMN} 1fr`,
      gridTemplateRows: '1fr 9fr',
      height: '10em'
    }

    return (<div>
      <VLHeader/>
      <div style={appStyle}>
        <VLButton
          value={"Load PDF template"}
          onClick={this.onLoadPDFFile}
          disabledButton={false}/>
        <VLButton
          value={"Load CSV table"}
          onClick={this.onLoadCSVFile}
          disabledButton={this.state.pdfFields.length === 0}/>
        <VLButton value={"Generate PDFs in folder"}
          disabledButton={this.state.csvFields.length === 0}/>

        <VLAvailableFields
          csvFields={this.state.csvFields}
          pdfFields={this.state.pdfFields}
          onFieldMappingChange={this.onFieldMappingChange}
          width={WIDTH_OF_COLUMN}
          empty={EMPTY}
          table={TABLE}
        />

        <div>
          {this.state.previewSrc ?
            <img id="pdf-preview" src={this.state.previewSrc}/> :
            <div style={{fontSize: '10em'}}>3</div>
          }
        </div>
      </div>
    </div>);
  }
}

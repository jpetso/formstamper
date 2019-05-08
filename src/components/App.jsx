import React from 'react'
import { remote, ipcRenderer } from 'electron'
import path from 'path'
import VLHeader from './VLHeader'
import VLButton from './VLButton'
import VLAvailableFields from './VLAvailableFields'

const { dialog } = remote
const TABLE = "table"
const TEXT = "text"
const WIDTH_OF_COLUMN = '15em'

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.onLoadCSVFile = this.onLoadCSVFile.bind(this)
    this.onLoadPDFFile = this.onLoadPDFFile.bind(this)
    this.onFieldMappingChange = this.onFieldMappingChange.bind(this)
    this.setAvailableFieldsState = this.setAvailableFieldsState.bind(this)
    this.state = {
      pdfFields: [],
      csvFields: [],
      previewSrc: '',
      pdfTemplatePath: '',
      fieldMappings: [],
      availableFieldsState: [],
    }

    const mapPdfFields = element => ({
      canEdit: true,
      isEditingCustomValue: false,
      fieldValue: element.fieldValue,
      selectIndex: 0
    })

    ipcRenderer.on('pdf-fields-available', (event, pdfTemplatePath, fields) => {
      this.setState(prevState => ({
        pdfFields: fields,
        pdfTemplatePath: pdfTemplatePath,
        fieldMappings: [],
        availableFieldsState: prevState.pdfFields.map(mapPdfFields)
      }))
    })

    ipcRenderer.on('csv-fields-available', (event, csvPath, fields) => {
      this.setState(prevState => ({
        csvFields: fields,
        fieldMappings: [],
        availableFieldsState: prevState.pdfFields.map(mapPdfFields)
      }))
    })

    ipcRenderer.on('pdf-preview-updated', (event, pdfTemplatePath, imgsrc) => {
      this.setState({ previewSrc: imgsrc })
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

  onGeneratePDFs() {
    const dirnames = dialog.showOpenDialog({properties: ['openDirectory']})
    if (!Array.isArray(dirnames) || dirnames.length !== 1) {
      return
    }

    ipcRenderer.send('generate-pdfs', this.state.pdfTemplatePath,
        dirnames[0] + path.sep + 'Tax Receipt {@TR_NUMBER} - {@NAME}.pdf',
        this.state.fieldMappings.filter(element => typeof element !== 'undefined'))
  }

  onFieldMappingChange(index, selectIndex) {
    const csvFieldValue = (selectIndex === 0)
      ? this.state.availableFieldsState[index].fieldValue
      : selectIndex
    const mappingSource = (selectIndex === 0) ? TEXT : TABLE
    const pdfFieldName = this.state.pdfFields[index].fieldName
    this.setState(
      prevState => {
        const newFieldMappingsEntry = (csvFieldValue === "")
          ? undefined
          : {
              fieldName: pdfFieldName,
              mapping: mappingSource === TABLE
                ? {
                    source: TABLE,
                    columnNumber: csvFieldValue,
                  }
                : {
                    source: TEXT,
                    text: csvFieldValue,
                  }
            }
        const fieldMappings = [...prevState.fieldMappings]
        fieldMappings[index] = newFieldMappingsEntry
        return {fieldMappings: fieldMappings}
      })
  }

  setAvailableFieldsState(index, setting) {
    this.setState(
      prevState =>
        ({
          availableFieldsState: prevState.availableFieldsState.map(
            (element, i) =>
              (i === index)
                ? Object.assign({}, element, setting)
                : element
          )
        })
    )
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
        <VLButton
          value={"Select output folder"}
          onClick={this.onGeneratePDFs.bind(this)}
          disabledButton={this.state.pdfTemplatePath === '' || this.state.csvFields.length === 0}/>

        <VLAvailableFields
          csvFields={this.state.csvFields}
          pdfFields={this.state.pdfFields}
          onFieldMappingChange={this.onFieldMappingChange}
          width={WIDTH_OF_COLUMN}
          text={TEXT}
          availableFieldsState={this.state.availableFieldsState}
          setAvailableFieldsState={this.setAvailableFieldsState}
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

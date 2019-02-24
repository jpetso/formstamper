import React from 'react'
import { remote, ipcRenderer } from 'electron'

const { dialog } = remote

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
    let styles = {}
    let fields = []

    if (this.props.pdfFields.length <= 0 && this.props.csvFields.length <= 0) {
      styles.visibility = "hidden";
    }
    else {
      fields = this.props.pdfFields.map((field) =>
        <li key={field.fieldName}>PDF: {field.fieldName}</li>
      )
      fields = fields.concat(this.props.csvFields.map((field) =>
        <li key={field.fieldName}>CSV: {field.fieldName}</li>
      ))
    }

    return (
      <div style={styles}>
        <h3>Available Fields</h3>
        <ul>{fields}</ul>
      </div>
    );
  }
}


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.onLoadCSVFile = this.onLoadCSVFile.bind(this)
    this.onLoadPDFFile = this.onLoadPDFFile.bind(this)
    this.state = {
      pdfFields: [],
      csvFields: [],
      previewSrc: ""
    }

    ipcRenderer.on('pdf-fields-available', (event, pdfTemplateFilename, fields) => {
      this.setState({ pdfFields: fields })
    })

    ipcRenderer.on('csv-fields-available', (event, csvFilename, fields) => {
      this.setState({ csvFields: fields })
    })

    ipcRenderer.on('pdf-preview-updated', (event, pdfTemplateFilename, imgsrc) => {
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

  render() {
    return (<div>
      <VLHeader />
      <VLButton value={"Load PDF template"} onClick={this.onLoadPDFFile} />
      <VLButton value={"Load CSV table"} onClick={this.onLoadCSVFile} />
      <VLButton value={"Generate PDFs in folder"} />

      <VLAvailableFields pdfFields={this.state.pdfFields} csvFields={this.state.csvFields} />
      <img id="pdf-preview" src={this.state.previewSrc} />
    </div>);
  }
}

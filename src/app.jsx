import React from 'react'
import { remote, ipcRenderer } from 'electron'
import parse from 'csv-parse'
import fs from 'fs'

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

    if (this.props.csv.length <= 0) {
      styles.visibility = "hidden";
    }
    else {
      //fields = this.props.csv[0].map((field) =>
      fields = require('module').globalPaths.map((field) =>
        <li>{field}</li>
      )
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
      csv: [],
      preview_src: ""
    }

    ipcRenderer.on('update-pdf-preview', (event, imgsrc) => {
      this.setState({ preview_src: imgsrc })
    })
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

    let context = this
    let rows = []
    let filestream = fs.createReadStream(filenames[0])
      .pipe(parse())
      .on('data', function(row) {
        console.log(row)
        rows.push(row)
      })
      .on('error', function(err) {
        dialog.showErrorBox("CSV loading error", err.message);
      })
      .on('end', function() {
        context.setState({ csv: rows })
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
    ipcRenderer.send('load-pdf', filenames[0])
  }

  render() {
    return (<div>
      <VLHeader />
      <VLButton value={"Load PDF with form fields"} onClick={this.onLoadPDFFile} />
      <VLButton value={"Load CSV table"} onClick={this.onLoadCSVFile} />
      <VLButton value={"Generate PDFs in folder"} />

      <VLAvailableFields csv={this.state.csv} />
      <img id="pdf-preview" src={this.state.preview_src} />
    </div>);
  }
}

import React from 'react'
import PdfFieldsDisplay from './PdfFieldsDisplay'
import CsvFieldsDisplay from './CsvFieldsDisplay'

export default class VLAvailableFields extends React.Component {
  render() {
    const containerStyle = {
      gridArea: '2 / 1 / span 1 / span 2',
      display: 'grid',
      gridTemplateColumns: `${this.props.width} ${this.props.width}`
    }

    return (
      <div style={containerStyle}>
        <PdfFieldsDisplay pdfFields={this.props.pdfFields}/>
        <div style={{fontSize: '10em',
          display: this.props.pdfFields.length === 0 ? 'initial' : 'none'}}>1</div>
        <CsvFieldsDisplay
          csvFields={this.props.csvFields}
          pdfFields={this.props.pdfFields}
          empty={this.props.empty}
          table={this.props.table}
          width={this.props.width}
          onFieldMappingChange={this.props.onFieldMappingChange}/>
        <div style={{fontSize: '10em',
          display: this.props.csvFields.length === 0 ? 'initial' : 'none'}}>2</div>
      </div>
    );
  }
}

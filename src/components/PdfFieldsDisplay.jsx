import React from 'react'

const PdfFieldsDisplay = (props) =>
  <div style={{display: props.pdfFields.length === 0 ? 'none' : 'grid'}}>
    {props.pdfFields.map(pdfElement =>
      <div key={`${pdfElement.fieldName}Div1`}
        style={{overflow: "auto"}}>{pdfElement.fieldName}
      </div>
    )}
  </div>

export default PdfFieldsDisplay

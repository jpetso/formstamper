import React from 'react'

const CsvFieldsDisplay = (props) => {
  const options = props.csvFields.map(csvElement =>
    <option value={csvElement.fieldName}
      key={`${csvElement.fieldName}Option`}>{csvElement.fieldName}</option>)

  return (
    <div style={{display: props.csvFields.length === 0 ? 'none' : 'grid'}}>
      {props.csvFields.length === 0 ? [] :
        props.pdfFields.map(pdfElement =>
          <div key={`${pdfElement.fieldName}Div2`}>
            <select onChange={event =>
              props.onFieldMappingChange(
                event.target.value,
                pdfElement.fieldName,
                props.table)}
              style={{maxWidth: props.width}}>
              <option value={props.empty}>{props.empty}</option>
              {options}
            </select>
          </div>)}
    </div>
  )
}

export default CsvFieldsDisplay

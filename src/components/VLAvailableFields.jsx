import React from 'react'
import VLFieldMappingInput from './VLFieldMappingInput'

const VLAvailableFields = (props) => {
  const containerStyle = {
    gridArea: '2 / 1 / span 1 / span 2',
    display: 'grid',
    gridTemplateColumns: `${props.width} 1fr`,
    overflowY: 'auto',
    overflowX: 'hidden'
  }

  return (
    <div style={containerStyle}>
      <div style={{display: props.pdfFields.length === 0 ? 'none' : 'grid'}}>
        {props.pdfFields.map(pdfElement =>
          <div key={`${pdfElement.fieldName}Div1`}
            style={{overflow: "hidden"}}
            title={pdfElement.fieldName}>{pdfElement.fieldName}
          </div>)}
      </div>
      <div style={{fontSize: '10em',
        display: props.pdfFields.length === 0 ? 'initial' : 'none'}}>1</div>
      <div style={{display: props.csvFields.length === 0 ? 'none' : 'grid'}}>
        {props.csvFields.length === 0 ? [] :
          props.pdfFields.map((pdfElement, index) =>
            <VLFieldMappingInput
              key={`${pdfElement.fieldName}Div2`}
              text={props.text}
              width={props.width}
              csvFields={props.csvFields}
              state={props.availableFieldsState[index]}
              index={index}
              setAvailableFieldsState={props.setAvailableFieldsState}
              onFieldMappingChange={props.onFieldMappingChange}/>)}
      </div>
      <div style={{fontSize: '10em',
        display: props.csvFields.length === 0 ? 'initial' : 'none'}}>2</div>
    </div>
  )
}

export default VLAvailableFields

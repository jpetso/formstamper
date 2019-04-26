import React from 'react'

const VLFieldMappingInput = (props) => {
  const options = props.csvFields.map(csvElement =>
    <option value={csvElement.columnNumber}
      key={`${csvElement.columnNumber}-col`}>{csvElement.fieldName}</option>)

  return (
    <div>
      <select
        onChange={event => {props.mapInput(
          props.pdfElement.fieldName,
          event.target.value,
          (event.target.options.selectedIndex === 0) ?
            props.text : props.table,
          event.target.options.selectedIndex === 0,
          props.index)
        }}
        style={{maxWidth: '13em',
        height: '1.5em',
        display: props.settings.isEditingCustomValue ? 'none' : 'initial'}}>
        <option value={props.settings.fieldValue}>{props.settings.fieldValue === ''
          ? props.empty : `Text: "${props.settings.fieldValue}"`}</option>
        {options}
      </select>
      <input type="text" style={{width: '12.75em',
        height: '1em',
        display: props.settings.isEditingCustomValue ? 'initial' : 'none'}}
        onChange={event => props.updateFieldValue(
          event,
          props.pdfElement.fieldName,
          props.text,
          props.index)}
        onKeyPress={event => props.updateFieldValue(
          event,
          props.pdfElement.fieldName,
          props.text,
          props.index)}></input>
      <button style={{width: '2em',
        display: props.settings.isEditingCustomValue ? 'none' : 'initial',
        height: '1.5em'}}
        disabled={!props.settings.canEdit}
        onClick={() => props.editCustomValue(props.index)}>p</button>
      <button style={{width: '2em',
        height: '1.5em',
        display: props.settings.isEditingCustomValue ? 'initial' : 'none'}}
        onClick={(event) => props.submitCustomValue(
          props.pdfElement,
          props.text,
          props.index
        )}>ok</button>
    </div>
  )
}

export default VLFieldMappingInput

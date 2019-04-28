import React from 'react'

const VLFieldMappingInput = (props) => {
  const options = props.csvFields.map(csvElement =>
    <option value={csvElement.columnNumber}
      key={`${csvElement.columnNumber}-col`}>{csvElement.fieldName}</option>)

  const selectHandler = event => props.updateFieldMappings(
    props.pdfElement.fieldName,
    event.target.value,
    props.index,
    event.target.options.selectedIndex)


  const inputHandler = event => props.updateFieldValue(
    event,
    props.pdfElement.fieldName,
    props.text,
    props.index)

  const okButtonHandler = () => props.submitCustomValue(
    props.pdfElement,
    props.text,
    props.index)

  return (
    <div>
      <select
        onChange={selectHandler}
        value={props.state.selectIndex}
        style={{maxWidth: '13em',
        height: '1.5em',
        display: props.state.isEditingCustomValue ? 'none' : 'initial'}}>
        <option value={props.state.fieldValue}>{props.state.fieldValue === ''
          ? props.empty : `Text: "${props.state.fieldValue}"`}</option>
        {options}
      </select>
      <input type="text" style={{width: '12.75em',
        height: '1em',
        display: props.state.isEditingCustomValue ? 'initial' : 'none'}}
        value={props.state.fieldValue}
        onChange={inputHandler}
        onKeyPress={inputHandler}></input>
      <button style={{width: '2em',
        display: props.state.isEditingCustomValue ? 'none' : 'initial',
        height: '1.5em'}}
        disabled={!props.state.canEdit}
        onClick={() => props.editCustomValue(props.index)}>p</button>
      <button style={{width: '2em',
        height: '1.5em',
        display: props.state.isEditingCustomValue ? 'initial' : 'none'}}
        onClick={okButtonHandler}>ok</button>
    </div>
  )
}

export default VLFieldMappingInput

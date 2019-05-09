import React from 'react'

const VLFieldMappingInput = (props) => {
  const options = props.csvFields.map(csvElement =>
    <option value={csvElement.columnNumber}
      key={`${csvElement.columnNumber}-col`}>{csvElement.fieldName}</option>)

  const selectHandler = event => {
    const selectedIndex = event.target.options.selectedIndex
    props.setFieldMapping(
      props.index,
      {
        selectedIndex: selectedIndex,
        state: {
                 selectedIndex: selectedIndex,
                 canEdit: selectedIndex === 0
               }
      }
    )
  }

  const submitCustomValue = () => {
    props.setFieldMapping(
      props.index,
      {
        selectedIndex: 0,
        state: {
                 isEditingCustomValue: false
               }
      }
    )
  }

  const inputHandler = event => {
    if(event.key == 'Enter') {
      submitCustomValue()
      return
    }
    props.setFieldMapping(
      props.index,
      {
        state: {
                 fieldValue: event.target.value
               }
      }
    )
  }

  const changeToEdit = () =>
    props.setFieldMapping(
      props.index,
      {
        state: {
                 isEditingCustomValue: true
               }
      }
    )

  return (
    <div>
      <select
        onChange={selectHandler}
        value={props.state.selectedIndex}
        style={{maxWidth: '13em',
        height: '1.5em',
        display: props.state.isEditingCustomValue ? 'none' : 'initial'}}>
        <option value={props.state.fieldValue}>{props.state.fieldValue === ''
          ? "<empty>" : `Text: "${props.state.fieldValue}"`}</option>
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
        onClick={changeToEdit}>p</button>
      <button style={{width: '2em',
        height: '1.5em',
        display: props.state.isEditingCustomValue ? 'initial' : 'none'}}
        onClick={submitCustomValue}>ok</button>
    </div>
  )
}

export default VLFieldMappingInput

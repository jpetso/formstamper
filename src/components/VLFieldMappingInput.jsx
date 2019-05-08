import React from 'react'

const VLFieldMappingInput = (props) => {
  const options = props.csvFields.map(csvElement =>
    <option value={csvElement.columnNumber}
      key={`${csvElement.columnNumber}-col`}>{csvElement.fieldName}</option>)

  const selectHandler = event => {
    const selectIndex = event.target.options.selectedIndex
    props.setAvailableFieldsState(
      props.index,
      {
        selectIndex: selectIndex,
        canEdit: selectIndex === 0
      }
    )
    props.onFieldMappingChange(
      props.index,
      selectIndex
    )
  }

  const submitCustomValue = () => {
    props.setAvailableFieldsState(
      props.index,
      {
        isEditingCustomValue: false
      }
    )
    props.onFieldMappingChange(
      props.index,
      0
    )
  }

  const inputHandler = event => {
    if(event.key == 'Enter') {
      submitCustomValue()
      return
    }
    props.setAvailableFieldsState(
      props.index,
      {
        fieldValue: event.target.value
      }
    )
  }

  return (
    <div>
      <select
        onChange={selectHandler}
        value={props.state.selectIndex}
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
        onClick={() => props.setAvailableFieldsState(props.index, {isEditingCustomValue: true})}>p</button>
      <button style={{width: '2em',
        height: '1.5em',
        display: props.state.isEditingCustomValue ? 'initial' : 'none'}}
        onClick={submitCustomValue}>ok</button>
    </div>
  )
}

export default VLFieldMappingInput

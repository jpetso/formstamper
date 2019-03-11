import React from 'react'

export default class VLFieldMappingInput extends React.Component {
  constructor(props) {
    super(props)
    this.mapInput = this.mapInput.bind(this)
    this.editCustomValue = this.editCustomValue.bind(this)
    this.submitCustomValue = this.submitCustomValue.bind(this)
    this.updateFieldValue = this.updateFieldValue.bind(this)
    this.state = {
      canEdit: true,
      isEditingCustomValue: false,
      fieldValue: this.props.pdfElement.fieldValue
    }
  }

  editCustomValue() {
    this.setState({isEditingCustomValue: true})
  }

  submitCustomValue(event) {
    this.setState(prevState => ({isEditingCustomValue: false,
      fieldValue: prevState.fieldValue}))
  }

  mapInput(event) {
    this.setState({canEdit: event.target.options.selectedIndex === 0})
    this.props.onFieldMappingChange(
      event.target.value,
      this.props.pdfElement.fieldName,
      (event.target.options.selectedIndex === 0) ?
        this.props.text : this.props.table)
  }

  updateFieldValue(event) {
    if(event.key == 'Enter') {
      this.submitCustomValue(event)
      return
    }
    this.setState({fieldValue: event.target.value})
  }

  render() {
    const options = this.props.csvFields.map(csvElement =>
      <option value={csvElement.columnNumber}
        key={`${csvElement.columnNumber}-col`}>{csvElement.fieldName}</option>)

    return (
      <div>
        <select
          onChange={this.mapInput}
          style={{maxWidth: '13em',
          height: '1.5em',
          display: this.state.isEditingCustomValue ? 'none' : 'initial'}}>
          <option value={this.state.fieldValue}>{this.state.fieldValue === ''
            ? this.props.empty : `Text: "${this.state.fieldValue}"`}</option>
          {options}
        </select>
        <input type="text" style={{width: '12.75em',
          height: '1em',
          display: this.state.isEditingCustomValue ? 'initial' : 'none'}}
          onChange={this.updateFieldValue}
          onKeyPress={this.updateFieldValue}></input>
        <button style={{width: '2em',
          display: this.state.isEditingCustomValue ? 'none' : 'initial',
          height: '1.5em'}}
          disabled={!this.state.canEdit}
          onClick={this.editCustomValue}>p</button>
        <button style={{width: '2em',
          height: '1.5em',
          display: this.state.isEditingCustomValue ? 'initial' : 'none'}}
          onClick={this.submitCustomValue}>ok</button>
      </div>
    )
  }
}

import React from 'react';

const VLFieldMappingInput = (props) => {
  const options = props.csvFields.map(csvElement =>
    (
      <option
        value={csvElement.columnNumber}
        key={`${csvElement.columnNumber}-col`}
      >
        {csvElement.fieldName}
      </option>
    ),
  );

  const selectHandler = (event) => {
    const selectedIndex = event.target.options.selectedIndex;
    props.setFieldMapping(
      props.index,
      {
        selectedIndex,
        state: {
          selectedIndex,
          canEdit: selectedIndex === 0,
        },
      },
    );
  };

  const submitCustomValue = () => {
    props.setFieldMapping(
      props.index,
      {
        selectedIndex: 0,
        state: {
          isEditingCustomValue: false,
        },
      },
    );
  };

  const inputHandler = (event) => {
    if (event.key === 'Enter') {
      submitCustomValue();
      return;
    }
    props.setFieldMapping(
      props.index,
      {
        state: {
          fieldValue: event.target.value,
        },
      },
    );
  };

  const changeToEdit = () =>
    props.setFieldMapping(
      props.index,
      {
        state: {
          isEditingCustomValue: true,
        },
      },
    );

  return (
    <div>
      <select
        value={props.state.selectedIndex}
        onChange={selectHandler}
        style={{
          maxWidth: '13em',
          height: '1.5em',
          display: props.state.isEditingCustomValue
            ? 'none'
            : 'initial',
        }}
      >
        <option
          value={props.state.fieldValue}
        >
          {props.state.fieldValue === ''
            ? '<empty>'
            : `Text: "${props.state.fieldValue}"`}
        </option>
        {options}
      </select>
      <input
        type="text"
        value={props.state.fieldValue}
        onChange={inputHandler}
        onKeyPress={inputHandler}
        style={{
          width: '12.75em',
          height: '1em',
          display: props.state.isEditingCustomValue
            ? 'initial'
            : 'none',
        }}
      />
      <button
        disabled={!props.state.canEdit}
        onClick={changeToEdit}
        style={{
          width: '2em',
          height: '1.5em',
          display: props.state.isEditingCustomValue
            ? 'none'
            : 'initial',
        }}
      >
        p
      </button>
      <button
        onClick={submitCustomValue}
        style={{
          width: '2em',
          height: '1.5em',
          display: props.state.isEditingCustomValue
            ? 'initial'
            : 'none',
        }}
      >
        ok
      </button>
    </div>
  );
};

export default VLFieldMappingInput;

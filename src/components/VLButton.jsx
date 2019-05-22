import React from 'react';

const VLButton = props =>
  (<div
    style={{ paddingLeft: '1em' }}
  >
    <button
      className="vl-button"
      onClick={props.onClick}
      style={{ width: '12em' }}
      disabled={props.disabledButton}
    >
      {props.value}
    </button>
  </div>);

export default VLButton;

import React from 'react';
import VLFieldMappingInput from './VLFieldMappingInput';

const VLAvailableFields = (props) => {
  const containerStyle = {
    gridArea: '2 / 1 / span 1 / span 2',
    display: 'grid',
    gridTemplateColumns: `${props.width} 1fr`,
    overflowY: 'auto',
    overflowX: 'hidden',
  };

  let placeholderFontSize = '10em';
  let placeholderText = 1;

  if (props.systemRequirementsStatus.isUsable !== true) {
    placeholderFontSize = '100%';
    placeholderText = 'The pdftk executable is not installed. Please download and install PDFtk Server from its website at https://www.pdflabs.com/tools/pdftk-server/ or use your system\'s package manager to install it.';
  }

  return (
    <div
      style={containerStyle}
    >
      <div
        style={{
          display: props.pdfFields.length === 0
            ? 'none'
            : 'grid',
        }}
      >
        {props.pdfFields.map(pdfElement =>
          (
            <div
              title={pdfElement.fieldName}
              key={`${pdfElement.fieldName}Div1`}
              style={{ overflow: 'hidden' }}
            >
              {pdfElement.fieldName}
            </div>
          )
        )}
      </div>
      <div
        style={{
          fontSize: placeholderFontSize,
          display: props.pdfFields.length === 0
            ? 'initial'
            : 'none',
        }}
      >
        {placeholderText}
      </div>
      <div
        style={{
          display: props.csvFields.length === 0
            ? 'none'
            : 'grid',
        }}
      >
        {props.pdfFields.map((pdfElement, index) =>
          (
            <VLFieldMappingInput
              key={`${pdfElement.fieldName}Div2`}
              csvFields={props.csvFields}
              state={props.availableFieldsState[index]}
              index={index}
              setFieldMapping={props.setFieldMapping}
              style={{
                display: props.csvFields.length === 0
                  ? 'none'
                  : 'initial',
              }}
            />
          ),
        )}
      </div>
      <div
        style={{
          fontSize: '10em',
          display: props.csvFields.length === 0
            ? 'initial'
            : 'none',
        }}
      >
        2
      </div>
    </div>
  );
};

export default VLAvailableFields;

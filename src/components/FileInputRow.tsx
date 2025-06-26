import React from "react";
import { Button, Input, Select, FormRow } from "./";
import type { SelectOption } from "./";

type FileInputRowProps = {
  label: string;
  defaultValue?: string;
  file?: string;
  actionOptions: string[];
  buttonText: string;
};

const FileInputRow: React.FC<FileInputRowProps> = ({
  label,
  defaultValue,
  file,
  actionOptions,
  buttonText
}) => {
  const selectOptions: SelectOption[] = actionOptions.map(option => ({
    value: option,
    label: option
  }));

  return (
    <FormRow className="file-input-row">
      <span className="file-input-label">{label}</span>
      {defaultValue && (
        <Input type="text" defaultValue={defaultValue} />
      )}
      {file && (
        <Input type="text" defaultValue={file} />
      )}
      <Select options={selectOptions} defaultValue={actionOptions[0]} />
      <Button>{buttonText}</Button>
    </FormRow>
  );
};

export default FileInputRow; 
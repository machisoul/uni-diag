import React from "react";
import { Button, Input, Select, FormRow } from "./ui";
import type { SelectOption } from "./ui";

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
  // 将字符串数组转换为SelectOption数组
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
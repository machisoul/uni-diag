import React from "react";

type FileInputRowProps = {
  label: string;
  defaultValue?: string;
  file?: string;
  actionOptions: string[];
  buttonText: string;
};

const FileInputRow: React.FC<FileInputRowProps> = ({ label, defaultValue, file, actionOptions, buttonText }) => {
  return (
    <div className="file-input-row">
      <label>{label}</label>
      {defaultValue && <input type="text" defaultValue={defaultValue} />}
      {file && <input type="text" defaultValue={file} />}
      <select>
        {actionOptions.map((opt, idx) => (
          <option key={idx}>{opt}</option>
        ))}
      </select>
      <button>{buttonText}</button>
    </div>
  );
};

export default FileInputRow; 
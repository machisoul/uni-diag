import React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  fullWidth?: boolean;
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  options, 
  error, 
  fullWidth = false,
  className = "",
  ...props 
}) => {
  const selectClasses = [
    "select",
    fullWidth ? "select-full-width" : "",
    error ? "select-error" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className="select-wrapper">
      {label && <label className="select-label">{label}</label>}
      <select className={selectClasses} {...props}>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="select-error-message">{error}</span>}
    </div>
  );
};

export default Select;

import React from "react";

export interface FieldsetProps {
  legend?: string;
  children: React.ReactNode;
  className?: string;
}

const Fieldset: React.FC<FieldsetProps> = ({ 
  legend, 
  children, 
  className = "" 
}) => {
  const fieldsetClasses = [
    "fieldset",
    className
  ].filter(Boolean).join(" ");

  return (
    <fieldset className={fieldsetClasses}>
      {legend && <legend className="fieldset-legend">{legend}</legend>}
      {children}
    </fieldset>
  );
};

export default Fieldset;

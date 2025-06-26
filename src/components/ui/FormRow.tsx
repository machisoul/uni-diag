import React from "react";

export interface FormRowProps {
  children: React.ReactNode;
  className?: string;
  gap?: "small" | "medium" | "large";
}

const FormRow: React.FC<FormRowProps> = ({ 
  children, 
  className = "",
  gap = "medium"
}) => {
  const gapClasses = {
    small: "form-row-gap-small",
    medium: "form-row-gap-medium", 
    large: "form-row-gap-large"
  };

  const rowClasses = [
    "form-row",
    gapClasses[gap],
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={rowClasses}>
      {children}
    </div>
  );
};

export default FormRow;

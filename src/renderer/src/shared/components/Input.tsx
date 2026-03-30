import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, ...rest }, ref) {
    return (
      <div className={`input-group ${className ?? ""}`}>
        {label && <label className="input-label">{label}</label>}
        <input
          ref={ref}
          className={`input-field ${error ? "input-field--error" : ""}`}
          {...rest}
        />
        {error && <span className="input-error">{error}</span>}
      </div>
    );
  },
);

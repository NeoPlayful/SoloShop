import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholderOption?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholderOption, className = "", ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="mb-1 block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full rounded border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-ring-focus focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {placeholderOption && <option value="">{placeholderOption}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

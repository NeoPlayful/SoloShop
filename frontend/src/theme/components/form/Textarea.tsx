import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="mb-1 block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full rounded border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-ring-focus focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full bg-surface border ${
          error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border focus:border-accent focus:ring-accent/20'
        } rounded-xl px-3.5 py-3 text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 transition-all leading-relaxed ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-danger-text font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-muted">{helperText}</p>}
    </div>
  );
};

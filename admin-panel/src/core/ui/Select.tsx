import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[] | string[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full bg-surface border ${
            error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border focus:border-accent focus:ring-accent/20'
          } rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 transition-all min-h-[44px] appearance-none pr-10 cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const text = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={val} value={val} className="bg-surface text-primary">
                {text}
              </option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger-text font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-muted">{helperText}</p>}
    </div>
  );
};

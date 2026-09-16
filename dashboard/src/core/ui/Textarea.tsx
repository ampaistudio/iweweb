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
        <label htmlFor={textareaId} className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full bg-stone-950 border ${
          error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-stone-800 focus:border-emerald-500 focus:ring-emerald-500/20'
        } rounded-xl px-3.5 py-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 transition-all leading-relaxed ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>}
    </div>
  );
};

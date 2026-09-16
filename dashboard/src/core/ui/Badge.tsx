import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  className = '',
}) => {
  const variantClasses = {
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
    error: 'bg-rose-950/80 text-rose-300 border-rose-500/30',
    info: 'bg-sky-950/80 text-sky-300 border-sky-500/30',
    neutral: 'bg-stone-800 text-stone-300 border-stone-700',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success'
            ? 'bg-emerald-400'
            : variant === 'warning'
            ? 'bg-amber-400'
            : variant === 'error'
            ? 'bg-rose-400'
            : variant === 'info'
            ? 'bg-sky-400'
            : 'bg-stone-400'
        }`}
      />
      <span>{children}</span>
    </span>
  );
};

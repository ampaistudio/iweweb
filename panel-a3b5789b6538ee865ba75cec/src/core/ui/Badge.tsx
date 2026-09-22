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
    success: 'bg-accent-soft text-accent-text border-accent/30',
    warning: 'bg-warning-soft text-warning-text border-warning-text/30',
    error: 'bg-danger-soft text-danger-text border-danger/30',
    info: 'bg-info-soft text-info-text border-info-text/30',
    neutral: 'bg-surface-elevated text-secondary border-border-strong',
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
            ? 'bg-accent'
            : variant === 'warning'
            ? 'bg-warning-text'
            : variant === 'error'
            ? 'bg-danger'
            : variant === 'info'
            ? 'bg-info-text'
            : 'bg-muted'
        }`}
      />
      <span>{children}</span>
    </span>
  );
};

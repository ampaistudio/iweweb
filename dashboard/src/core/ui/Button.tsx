import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] select-none';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2 text-sm gap-2 min-h-[44px]', // 44px accessible touch target for tablet
    lg: 'px-6 py-3 text-base gap-2.5 min-h-[50px]',
  };

  const variantClasses = {
    primary:
      'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950/40 focus:ring-emerald-500 border border-emerald-500/30',
    secondary:
      'bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700/80 focus:ring-stone-500',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-950/40 focus:ring-rose-500 border border-rose-500/30',
    outline:
      'bg-transparent hover:bg-stone-800 text-stone-200 border border-stone-700 hover:border-stone-600 focus:ring-stone-500',
    ghost:
      'bg-transparent hover:bg-stone-800 text-stone-300 hover:text-stone-100 focus:ring-stone-500',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const effectiveLeftIcon = icon || leftIcon;
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none focus:outline-none focus:ring-2 focus:ring-slate-900/15';

    const variantStyles = {
      primary:
        'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-xs',
      secondary:
        'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700',
      outline:
        'border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700',
      ghost:
        'hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs shadow-rose-500/20',
      success:
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs shadow-emerald-500/20',
    };

    const sizeStyles = {
      xs: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 h-7',
      sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5 h-8',
      md: 'text-sm px-4 py-2 rounded-xl gap-2 h-10',
      lg: 'text-base px-5 py-2.5 rounded-2xl gap-2.5 h-12',
      icon: 'p-2 rounded-xl h-10 w-10 shrink-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          effectiveLeftIcon && <span className="shrink-0">{effectiveLeftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';

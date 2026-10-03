import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeStyles = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2
      className={cn('animate-spin text-blue-600', sizeStyles[size], className)}
    />
  );
}

export function LoadingState({
  message,
  text,
  className,
}: {
  message?: string;
  text?: string;
  className?: string;
}) {
  const displayText = text || message || 'Cargando información...';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 space-y-3 select-none',
        className,
      )}
    >
      <Spinner size="lg" />
      <p className="text-xs font-medium text-slate-500">{displayText}</p>
    </div>
  );
}

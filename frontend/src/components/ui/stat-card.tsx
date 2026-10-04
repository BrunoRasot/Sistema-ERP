import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  variant?: 'default' | 'emerald' | 'amber' | 'sky' | 'rose';
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  title,
  value,
  subtitle,
  icon,
  iconColor,
  variant,
  trend,
  className,
  onClick,
}: StatCardProps) {
  const isClickable = Boolean(onClick);
  const displayLabel = label || title || '';
  
  const defaultIconColor =
    variant === 'emerald'
      ? 'bg-emerald-50 text-emerald-600'
      : variant === 'amber'
      ? 'bg-amber-50 text-amber-600'
      : variant === 'sky'
      ? 'bg-sky-50 text-sky-600'
      : variant === 'rose'
      ? 'bg-rose-50 text-rose-600'
      : 'bg-blue-50 text-blue-600';

  const resolvedIconColor = iconColor || defaultIconColor;

  return (
    <div
      onClick={onClick}
      className={cn(
        'card p-4 sm:p-5 flex flex-col justify-between transition-all duration-150',
        isClickable && 'cursor-pointer hover:border-slate-300 hover:shadow-xs active:scale-[0.99]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 truncate">{displayLabel}</span>
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', resolvedIconColor)}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md',
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700',
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <TrendingDown className="w-3 h-3 stroke-[2.5]" />
              )}
              <span>{trend.value}</span>
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

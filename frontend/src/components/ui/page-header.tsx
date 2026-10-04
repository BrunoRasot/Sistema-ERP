import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  subtitle,
  icon,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  const displaySubtitle = description || subtitle;

  return (
    <div
      className={cn(
        'shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2',
        className,
      )}
    >
      <div>
        <div className="flex items-center gap-2.5">
          {icon && <span className="shrink-0">{icon}</span>}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {displaySubtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-normal">
            {displaySubtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

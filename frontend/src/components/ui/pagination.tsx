import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 50,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs font-medium text-slate-500',
        className,
      )}
    >
      <div>
        {totalItems !== undefined ? (
          <span>
            Mostrando <strong className="text-slate-900 font-bold">{startItem}</strong> -{' '}
            <strong className="text-slate-900 font-bold">{endItem}</strong> de{' '}
            <strong className="text-slate-900 font-bold">{totalItems}</strong> registros
          </span>
        ) : (
          <span>
            Página <strong className="text-slate-900 font-bold">{currentPage}</strong> de{' '}
            <strong className="text-slate-900 font-bold">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Anterior
        </Button>

        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 font-bold text-xs">
          {currentPage} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

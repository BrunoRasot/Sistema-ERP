'use client';

import React from 'react';
import {
  Wallet,
  Phone,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { ReceivableSale } from '../types/payment';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge, Button } from '@/components/ui';

interface ReceivableCardProps {
  sale: ReceivableSale;
  onCollect: (sale: ReceivableSale) => void;
}

export function ReceivableCard({ sale, onCollect }: ReceivableCardProps) {
  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition p-4 sm:p-5 flex flex-col justify-between space-y-4"
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-900">{sale.saleNumber}</span>
            <span className="text-[11px] text-slate-400 font-medium">
              {formatDate(sale.createdAt)}
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-0.5">
            {sale.customer.name}
          </h4>
        </div>

        {sale.isLate ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <AlertTriangle className="w-3 h-3 text-slate-500" />
            Mora: {sale.overdueDays}d
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <Clock className="w-3 h-3 text-slate-400" />
            Al Día
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Doc:</span>
          <span className="font-medium text-slate-700">
            {sale.customer.documentType}: {sale.customer.documentNumber}
          </span>
        </div>

        {sale.customer.phone && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Contacto:</span>
            <a
              href={`tel:${sale.customer.phone}`}
              className="text-slate-800 font-semibold hover:underline flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{sale.customer.phone}</span>
            </a>
          </div>
        )}

        {sale.dueDate && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Vencimiento:</span>
            <span className="font-semibold text-slate-700">
              {formatDate(sale.dueDate)}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Total Venta:</span>
          <span className="font-bold text-slate-800">{formatCurrency(sale.total)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Abonado a la fecha:</span>
          <span className="font-semibold text-slate-800">
            {formatCurrency(sale.paidAmount)}
          </span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700">Saldo Pendiente:</span>
          <span className="font-black text-base text-slate-900">
            {formatCurrency(sale.balanceDue)}
          </span>
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={() => onCollect(sale)}
        icon={<Wallet className="w-4 h-4" />}
        className="w-full"
      >
        Registrar Cobro / Amortizar
      </Button>
    </div>
  );
}

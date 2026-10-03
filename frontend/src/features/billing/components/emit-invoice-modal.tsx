'use client';

import React, { useState } from 'react';
import {
  X,
  Receipt,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Building2,
  User,
} from 'lucide-react';
import { InvoiceType } from '../types/billing';
import { billingService } from '../services/billing-service';
import { formatCurrency, formatDate } from '@/lib/utils';

interface EmitInvoiceModalProps {
  sale: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (documentId: string) => void;
}

export function EmitInvoiceModal({
  sale,
  isOpen,
  onClose,
  onSuccess,
}: EmitInvoiceModalProps) {
  const isCompany = sale?.customer?.documentType === 'RUC';
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(
    isCompany ? 'FACTURA' : 'BOLETA',
  );
  const [customerChannel, setCustomerChannel] = useState<string>('WHATSAPP');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !sale) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (invoiceType === 'FACTURA' && (!isCompany || sale.customer.documentNumber.length !== 11)) {
      setErrorMessage(
        'Para emitir una Factura Electrónica, el cliente debe contar con RUC válido de 11 dígitos.',
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await billingService.emitInvoice({
        saleId: sale.id,
        invoiceType,
        customerChannel,
      });

      onSuccess(res.document.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al emitir el comprobante electrónico');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Emitir Comprobante</h3>
              <p className="text-xs text-slate-500">{sale.saleNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-900">{sale.customer?.name || 'Público General'}</p>
                <p className="text-[11px] text-slate-500">
                  {sale.customer?.documentType || 'DNI'}: {sale.customer?.documentNumber || '00000000'}
                </p>
              </div>
              <span className="font-black text-sm text-brand-700">
                {formatCurrency(sale.total)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
              <span>Op. Gravada: {formatCurrency(sale.subtotal)}</span>
              <span>IGV (18%): {formatCurrency(sale.tax)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Tipo de Comprobante:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInvoiceType('BOLETA')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  invoiceType === 'BOLETA'
                    ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="text-[10px] font-bold text-slate-400">B001</span>
                </div>
                <div className="mt-2">
                  <p className="font-bold text-slate-900">Boleta</p>
                  <p className="text-[10px] text-slate-400">Consumidor final</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInvoiceType('FACTURA')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  invoiceType === 'FACTURA'
                    ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span className="text-[10px] font-bold text-slate-400">F001</span>
                </div>
                <div className="mt-2">
                  <p className="font-bold text-slate-900">Factura</p>
                  <p className="text-[10px] text-slate-400">Empresas con RUC</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Envío Automático al Cliente:</label>
            <select
              value={customerChannel}
              onChange={(e) => setCustomerChannel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="WHATSAPP">WhatsApp (PDF y XML)</option>
              <option value="EMAIL">Correo Electrónico</option>
              <option value="AMBOS">WhatsApp y Correo</option>
              <option value="NINGUNO">Solo Impresión Local</option>
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir a SUNAT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { X, Printer, Loader2, QrCode, CheckCircle2, Droplets } from 'lucide-react';
import { TicketData } from '../types/billing';
import { billingService } from '../services/billing-service';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TicketViewerModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketViewerModal({
  documentId,
  isOpen,
  onClose,
}: TicketViewerModalProps) {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      setIsLoading(true);
      setError(null);
      billingService
        .getTicketData(documentId)
        .then((data) => setTicket(data))
        .catch((err) => setError(err?.message || 'Error al cargar el ticket'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 print:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Ticketera Térmica (80mm)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            <span className="text-xs font-semibold">Generando formato de ticket...</span>
          </div>
        ) : error || !ticket ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl">
            {error || 'No se pudo cargar el ticket'}
          </div>
        ) : (
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-dashed border-slate-300 font-mono text-[11px] leading-tight space-y-3 text-slate-800">
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2.5">
              <p className="font-black text-sm tracking-wide">{ticket.company.nombreComercial}</p>
              <p className="text-[10px] text-slate-600 font-bold">{ticket.company.razonSocial}</p>
              <p className="text-[10px] text-slate-500">R.U.C. N° {ticket.company.ruc}</p>
              <p className="text-[9px] text-slate-500">{ticket.company.address}</p>
              <p className="text-[9px] text-slate-500">
                {ticket.company.district} - {ticket.company.province}
              </p>
            </div>

            <div className="text-center border-b border-dashed border-slate-300 pb-2 space-y-0.5">
              <p className="font-black text-xs text-slate-900">{ticket.documentTypeLabel}</p>
              <p className="font-black text-sm text-brand-700">{ticket.documentNumber}</p>
              <p className="text-[10px] text-slate-500">
                Fecha de Emisión: {formatDate(ticket.issueDate)}
              </p>
            </div>

            <div className="border-b border-dashed border-slate-300 pb-2 space-y-0.5 text-[10px]">
              <p>
                <span className="font-bold">Cliente:</span> {ticket.customer.name}
              </p>
              <p>
                <span className="font-bold">{ticket.customer.documentType}:</span>{' '}
                {ticket.customer.documentNumber}
              </p>
              {ticket.customer.address && ticket.customer.address !== '-' && (
                <p>
                  <span className="font-bold">Dirección:</span> {ticket.customer.address}
                </p>
              )}
            </div>

            <div className="border-b border-dashed border-slate-300 pb-2 space-y-1">
              <div className="flex justify-between font-bold text-[10px] text-slate-600 border-b border-slate-200 pb-0.5">
                <span>[CANT] DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
              {ticket.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start text-[10px]">
                  <div className="pr-1">
                    <p className="font-bold text-slate-800">
                      [{it.quantity}] {it.name}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      P.U: {formatCurrency(it.unitPrice)}
                    </p>
                  </div>
                  <span className="font-bold shrink-0">{formatCurrency(it.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-slate-300 pb-2 space-y-0.5 text-[10px]">
              <div className="flex justify-between text-slate-600">
                <span>OP. GRAVADA:</span>
                <span>{formatCurrency(ticket.financials.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>I.G.V. (18%):</span>
                <span>{formatCurrency(ticket.financials.tax)}</span>
              </div>
              <div className="flex justify-between font-black text-xs text-slate-900 pt-1 border-t border-slate-200">
                <span>IMPORTE TOTAL:</span>
                <span>{formatCurrency(ticket.financials.total)}</span>
              </div>
            </div>

            <div className="text-[9px] font-bold text-slate-600 border-b border-dashed border-slate-300 pb-1.5 uppercase">
              {ticket.financials.wordsTotal}
            </div>

            {/* QR y Resumen Digital SUNAT */}
            <div className="text-center space-y-1.5 pt-1">
              <div className="w-16 h-16 border border-slate-400 mx-auto flex items-center justify-center bg-white rounded-lg p-1">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <p className="text-[8px] text-slate-400 break-all leading-tight">
                Hash: {ticket.sunat.hash}
              </p>
              <div className="text-[8px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
                <p className="font-bold text-emerald-700">COMPROBANTE ACEPTADO POR SUNAT</p>
                <p>Representación impresa de la Factura/Boleta Electrónica</p>
                <p>Consulte su validez en: https://www.sunat.gob.pe</p>
                <p className="font-bold pt-0.5">¡GRACIAS POR SU PREFERENCIA!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

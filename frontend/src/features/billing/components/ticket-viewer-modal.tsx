'use client';

import React, { useEffect, useState } from 'react';
import { Printer, QrCode, CheckCircle2, Droplets } from 'lucide-react';
import { TicketData } from '../types/billing';
import { billingService } from '../services/billing-service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal, Button, Spinner } from '@/components/ui';

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ticketera Térmica (80mm)"
      description="Representación impresa del comprobante electrónico"
      icon={<Printer className="w-5 h-5" />}
      iconColor="bg-slate-900 text-white"
      size="sm"
      footer={
        <div className="flex items-center gap-2 w-full justify-between print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir Ticket
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <Spinner size="md" />
          <p className="text-xs text-slate-500 font-medium">Generando vista de ticket...</p>
        </div>
      ) : error ? (
        <div className="p-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          {error}
        </div>
      ) : !ticket ? null : (
        <div
          id="thermal-ticket-container"
          className="font-mono text-xs text-slate-800 bg-white p-4 border border-slate-200 rounded-2xl shadow-inner space-y-3"
        >
          {/* Header Empresa */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white mb-1">
              <Droplets className="w-4 h-4" />
            </div>
            <h4 className="font-black text-sm tracking-tight">
              {ticket.company.nombreComercial || ticket.company.razonSocial}
            </h4>
            <p className="text-[10px] text-slate-500">{ticket.company.address}</p>
            <p className="text-[10px] font-bold">RUC: {ticket.company.ruc}</p>
          </div>

          {/* Datos del Comprobante */}
          <div className="border-b border-dashed border-slate-300 pb-2 space-y-0.5 text-[11px]">
            <p className="font-bold text-center text-xs text-slate-900">
              {ticket.documentTypeLabel} ELECTRÓNICA
            </p>
            <p className="font-black text-center text-sm tracking-wider text-blue-700">
              {ticket.documentNumber}
            </p>
            <div className="flex justify-between pt-1 text-[10px] text-slate-500">
              <span>FECHA DE EMISIÓN:</span>
              <span>{formatDate(ticket.issueDate)}</span>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="border-b border-dashed border-slate-300 pb-2 space-y-0.5 text-[10px]">
            <p>
              <span className="text-slate-500">CLIENTE: </span>
              <span className="font-bold">{ticket.customer.name}</span>
            </p>
            <p>
              <span className="text-slate-500">{ticket.customer.documentType}: </span>
              <span className="font-bold">{ticket.customer.documentNumber}</span>
            </p>
            {ticket.customer.address && (
              <p>
                <span className="text-slate-500">DIRECCIÓN: </span>
                <span>{ticket.customer.address}</span>
              </p>
            )}
          </div>

          {/* Ítems del Ticket */}
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

          {/* Totales */}
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
    </Modal>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Receipt,
  AlertTriangle,
  Send,
  Building2,
  User,
} from 'lucide-react';
import { InvoiceType } from '../types/billing';
import { billingService } from '../services/billing-service';
import { formatCurrency } from '@/lib/utils';
import { Modal, Button, Select } from '@/components/ui';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emitir Comprobante SUNAT"
      description={sale.saleNumber}
      icon={<Receipt className="w-5 h-5" />}
      iconColor="bg-blue-50 text-blue-600"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-900">{sale.customer?.name || 'Público General'}</p>
              <p className="text-[11px] text-slate-500">
                {sale.customer?.documentType || 'DNI'}: {sale.customer?.documentNumber || '00000000'}
              </p>
            </div>
            <span className="font-black text-sm text-blue-700">
              {formatCurrency(sale.total)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
            <span>Op. Gravada: {formatCurrency(sale.subtotal)}</span>
            <span>IGV (18%): {formatCurrency(sale.tax)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Tipo de Comprobante:</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={invoiceType === 'BOLETA' ? 'primary' : 'outline'}
              onClick={() => setInvoiceType('BOLETA')}
              className="h-auto p-3 flex flex-col items-start gap-1 justify-between text-left"
            >
              <div className="flex items-center justify-between w-full">
                <User className="w-4 h-4" />
                <span className="text-[10px] font-bold opacity-75">B001</span>
              </div>
              <div className="mt-1">
                <p className="font-bold">Boleta</p>
                <p className="text-[10px] opacity-75 font-normal">Consumidor final</p>
              </div>
            </Button>

            <Button
              type="button"
              variant={invoiceType === 'FACTURA' ? 'primary' : 'outline'}
              onClick={() => setInvoiceType('FACTURA')}
              className="h-auto p-3 flex flex-col items-start gap-1 justify-between text-left"
            >
              <div className="flex items-center justify-between w-full">
                <Building2 className="w-4 h-4" />
                <span className="text-[10px] font-bold opacity-75">F001</span>
              </div>
              <div className="mt-1">
                <p className="font-bold">Factura</p>
                <p className="text-[10px] opacity-75 font-normal">Empresas con RUC</p>
              </div>
            </Button>
          </div>
        </div>

        <Select
          label="Canal de Notificación:"
          value={customerChannel}
          onChange={(e) => setCustomerChannel(e.target.value)}
          options={[
            { value: 'WHATSAPP', label: 'WhatsApp (Automático con link PDF)' },
            { value: 'EMAIL', label: 'Correo Electrónico' },
            { value: 'AMBOS', label: 'Ambos (WhatsApp + Email)' },
            { value: 'NINGUNO', label: 'Solo emitir (Sin enviar notificación)' },
          ]}
        />

        <div className="pt-2 flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="w-1/2">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Send className="w-4 h-4" />}
            className="w-1/2"
          >
            Emitir a SUNAT
          </Button>
        </div>
      </form>
    </Modal>
  );
}

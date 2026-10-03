'use client';

import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Check,
} from 'lucide-react';
import { ReceivableSale } from '../types/payment';
import { paymentService } from '../services/payment-service';
import { PaymentMethod } from '@/features/cash/types/cash';
import { formatCurrency } from '@/lib/utils';
import { Modal, Button, Input, Select } from '@/components/ui';

interface CollectPaymentModalProps {
  sale: ReceivableSale;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CollectPaymentModal({
  sale,
  isOpen,
  onClose,
  onSuccess,
}: CollectPaymentModalProps) {
  const maxBalance = Number(sale.balanceDue);
  const [amount, setAmount] = useState<number>(maxBalance);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [operationCode, setOperationCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptResult, setReceiptResult] = useState<any | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (isNaN(amount) || amount <= 0) {
      errs.amount = 'El monto a cobrar debe ser mayor a 0.';
    } else if (amount > maxBalance) {
      errs.amount = `El monto no puede superar la deuda pendiente (${formatCurrency(maxBalance)}).`;
    }

    if (paymentMethod !== 'EFECTIVO' && !operationCode.trim()) {
      errs.operationCode = 'Ingrese el código o número de operación.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await paymentService.collectPayment({
        saleId: sale.id,
        amount: Number(amount),
        paymentMethod,
        operationCode: operationCode.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setReceiptResult(res);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al registrar el cobro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setReceiptResult(null);
        onClose();
      }}
      title={receiptResult ? '¡Abono Registrado Exitosamente!' : 'Registrar Cobro de Venta'}
      description={receiptResult ? `Comprobante: ${receiptResult.saleNumber}` : sale.saleNumber}
      icon={receiptResult ? <CheckCircle2 className="w-5 h-5 text-slate-800" /> : <Wallet className="w-5 h-5 text-slate-800" />}
      iconColor="bg-slate-100"
      size="sm"
    >
      {receiptResult ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-bold text-slate-800">{receiptResult.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Monto Cobrado:</span>
              <span className="font-black text-slate-900 text-sm">
                {formatCurrency(receiptResult.amountCollected)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Medio de Pago:</span>
              <span className="font-semibold text-slate-800">{paymentMethod}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-500">Saldo Restante:</span>
              <span
                className={`font-black ${
                  receiptResult.newBalanceDue === 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {receiptResult.newBalanceDue === 0
                  ? '¡Deuda Cancelada Totalmente!'
                  : formatCurrency(receiptResult.newBalanceDue)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setReceiptResult(null);
              onClose();
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            Cerrar
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <p className="font-bold text-slate-900 text-xs">{sale.customer.name}</p>
            <p className="text-[11px] text-slate-500">
              {sale.customer.documentType}: {sale.customer.documentNumber} · Cel: {sale.customer.phone}
            </p>
            <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Deuda Pendiente Total:</span>
              <span className="font-black text-rose-600">{formatCurrency(maxBalance)}</span>
            </div>
          </div>

          <div>
            <Input
              label="Monto a Cobrar (S/)"
              type="number"
              min="0.10"
              max={maxBalance}
              step="0.10"
              required
              value={amount}
              onChange={(e) => {
                setAmount(parseFloat(e.target.value) || 0);
                if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: '' }));
              }}
              className="text-center text-xl font-black text-slate-900"
              leftIcon={<DollarSign className="w-4 h-4" />}
              error={fieldErrors.amount}
            />

            {/* Accesos rápidos de monto */}
            <div className="grid grid-cols-2 gap-1.5 pt-1.5">
              <button
                type="button"
                onClick={() => setAmount(Number((maxBalance / 2).toFixed(2)))}
                className="py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
              >
                50% ({formatCurrency(maxBalance / 2)})
              </button>
              <button
                type="button"
                onClick={() => setAmount(maxBalance)}
                className="py-1 text-xs font-bold rounded-lg border border-slate-900 bg-slate-900 text-white shadow-xs transition"
              >
                100% Total ({formatCurrency(maxBalance)})
              </button>
            </div>
          </div>

          <Select
            label="Medio de Pago"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value as PaymentMethod);
              if (fieldErrors.operationCode) setFieldErrors((prev) => ({ ...prev, operationCode: '' }));
            }}
            options={[
              { value: 'EFECTIVO', label: 'Efectivo (Caja Física)' },
              { value: 'YAPE', label: 'Yape' },
              { value: 'PLIN', label: 'Plin' },
              { value: 'TARJETA', label: 'Tarjeta (POS)' },
              { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
            ]}
          />

          {paymentMethod !== 'EFECTIVO' && (
            <Input
              label="N° Operación / Referencia"
              type="text"
              required
              value={operationCode}
              onChange={(e) => {
                setOperationCode(e.target.value);
                if (fieldErrors.operationCode) setFieldErrors((prev) => ({ ...prev, operationCode: '' }));
              }}
              placeholder="Ej: Op. 849204"
              error={fieldErrors.operationCode}
            />
          )}

          <Input
            label="Notas del Cobro"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Abono acordado con cliente"
          />

          <div className="pt-2 flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="w-1/2">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              leftIcon={<Check className="w-4 h-4" />}
              className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isLoading ? 'Cobrando...' : 'Registrar Cobro'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

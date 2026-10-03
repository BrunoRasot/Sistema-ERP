'use client';

import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  DollarSign,
  AlertCircle,
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

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptResult, setReceiptResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > maxBalance) {
      setErrorMessage(`El monto debe ser entre S/ 0.10 y S/ ${maxBalance.toFixed(2)}`);
      return;
    }

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
      title={receiptResult ? '¡Abono Registrado Exitosamente!' : 'Registrar Cobro'}
      description={receiptResult ? `Comprobante: ${receiptResult.saleNumber}` : sale.saleNumber}
      icon={receiptResult ? <CheckCircle2 className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
      iconColor={receiptResult ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}
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
              <span className="font-black text-emerald-600 text-sm">
                {formatCurrency(receiptResult.amountCollected)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Medio de Pago:</span>
              <span className="font-semibold text-blue-600">{paymentMethod}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-500">Saldo Restante:</span>
              <span
                className={`font-black ${
                  receiptResult.newBalanceDue === 0 ? 'text-emerald-700' : 'text-rose-600'
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
            className="w-full"
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
              <span className="text-slate-500 font-medium">Deuda Pendiente:</span>
              <span className="font-black text-rose-600">{formatCurrency(maxBalance)}</span>
            </div>
          </div>

          <Input
            label="Monto a Cobrar (S/)"
            type="number"
            min="0.10"
            max={maxBalance}
            step="0.10"
            required
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="text-center text-lg font-black text-emerald-700"
            leftIcon={<DollarSign className="w-4 h-4" />}
          />

          <Select
            label="Medio de Pago"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
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
              value={operationCode}
              onChange={(e) => setOperationCode(e.target.value)}
              placeholder="Ej: Op. 849204"
            />
          )}

          <Input
            label="Notas del Cobro"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Pago parcial acordado"
          />

          <div className="pt-2 flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="w-1/2">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-1/2"
            >
              Registrar Cobro
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

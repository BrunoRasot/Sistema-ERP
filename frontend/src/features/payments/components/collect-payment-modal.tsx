'use client';

import React, { useState } from 'react';
import {
  X,
  Wallet,
  CheckCircle2,
  DollarSign,
  Loader2,
  AlertCircle,
  Receipt,
  User,
} from 'lucide-react';
import { ReceivableSale } from '../types/payment';
import { paymentService } from '../services/payment-service';
import { PaymentMethod } from '@/features/cash/types/cash';
import { formatCurrency } from '@/lib/utils';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
        {receiptResult ? (
          /* Recibo de Cobro Exitoso */
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">¡Abono Registrado!</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Comprobante: {receiptResult.saleNumber}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-800">{receiptResult.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto Cobrado:</span>
                <span className="font-black text-emerald-600 text-sm">
                  {formatCurrency(receiptResult.amountCollected)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medio de Pago:</span>
                <span className="font-semibold text-brand-600">{paymentMethod}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between">
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

            <button
              onClick={() => {
                setReceiptResult(null);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
            >
              Cerrar
            </button>
          </div>
        ) : (
          /* Formulario de Cobro */
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registrar Cobro</h3>
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
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">{sale.customer.name}</p>
                <p className="text-[11px] text-slate-500">
                  {sale.customer.documentType}: {sale.customer.documentNumber} · Cel: {sale.customer.phone}
                </p>
                <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">Saldo Pendiente:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {formatCurrency(maxBalance)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Monto a Cobrar (S/):</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmount(maxBalance)}
                    className="flex-1 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition text-[11px]"
                  >
                    Total ({formatCurrency(maxBalance)})
                  </button>
                  {maxBalance > 10 && (
                    <button
                      type="button"
                      onClick={() => setAmount(Math.round((maxBalance / 2) * 100) / 100)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200 hover:bg-slate-200 transition text-[11px]"
                    >
                      50%
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.10"
                  min="0.10"
                  max={maxBalance}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Medio de Cobro:</label>
                <div className="grid grid-cols-4 gap-1.5 font-bold text-[11px]">
                  {(['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 rounded-xl border transition text-center ${
                        paymentMethod === m
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'EFECTIVO' && (
                <input
                  type="text"
                  value={operationCode}
                  onChange={(e) => setOperationCode(e.target.value)}
                  placeholder="Código de Operación Yape/Plin/Banco..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              )}

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observación o nota del abono (opcional)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
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
                  disabled={isLoading || amount <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      <span>Cobrar {formatCurrency(amount)}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  RotateCcw,
  DollarSign,
  Loader2,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { Order, DeliverOrderInput } from '../types/order';
import { orderService } from '../services/order-service';
import { PaymentMethod } from '@/features/cash/types/cash';
import { SaleType } from '@/features/sales/types/sale';
import { formatCurrency } from '@/lib/utils';

interface DeliverOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliverOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: DeliverOrderModalProps) {
  const returnableCount =
    order.items?.reduce(
      (sum, item) => (item.product?.isReturnable ? sum + item.quantity : sum),
      0,
    ) || 0;

  const [bottlesDelivered, setBottlesDelivered] = useState<number>(returnableCount);
  const [bottlesReturned, setBottlesReturned] = useState<number>(returnableCount);
  const [saleType, setSaleType] = useState<SaleType>('CONTADO');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [operationCode, setOperationCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedSummary, setCompletedSummary] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const payload: DeliverOrderInput = {
      bottlesDelivered: Number(bottlesDelivered) || 0,
      bottlesReturned: Number(bottlesReturned) || 0,
      saleType,
      paymentMethod: saleType === 'CONTADO' ? paymentMethod : undefined,
      operationCode: operationCode.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const res = await orderService.deliverOrder(order.id, payload);
      setCompletedSummary(res);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al completar la entrega');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
        {completedSummary ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">¡Pedido Entregado con Éxito!</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Venta registrada: {completedSummary.sale?.saleNumber}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Total cobrado:</span>
                <span className="font-black text-slate-900 text-sm">
                  {formatCurrency(completedSummary.sale?.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Condición de pago:</span>
                <span className="font-bold text-brand-600">
                  {completedSummary.sale?.saleType} ({paymentMethod})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-amber-800 font-semibold">
                <span>Custodia de bidones:</span>
                <span>
                  {completedSummary.bottlesSummary?.returned} devueltos / {completedSummary.bottlesSummary?.delivered} entregados
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setCompletedSummary(null);
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
            >
              Finalizar
            </button>
          </div>
        ) : (
          /* Formulario de Entrega */
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Completar Entrega</h3>
                <p className="text-xs text-slate-500">
                  {order.orderNumber} — {order.customer?.name}
                </p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 bg-brand-50/70 border border-brand-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-brand-700 block uppercase">
                    Monto Total del Pedido
                  </span>
                  <span className="text-xl font-black text-brand-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <Receipt className="w-6 h-6 text-brand-500" />
              </div>

              {returnableCount > 0 && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <RotateCcw className="w-4 h-4" />
                    <span>Control de Envases Retornables ({returnableCount} en pedido)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Llenos entregados:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bottlesDelivered}
                        onChange={(e) => setBottlesDelivered(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-center bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Vacíos devueltos:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bottlesReturned}
                        onChange={(e) => setBottlesReturned(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-xl font-bold text-center bg-white text-amber-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSaleType('CONTADO')}
                    className={`py-2 rounded-xl border transition ${
                      saleType === 'CONTADO'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Cobro al Contado
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleType('CREDITO')}
                    className={`py-2 rounded-xl border transition ${
                      saleType === 'CREDITO'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    A Crédito
                  </button>
                </div>

                {saleType === 'CONTADO' && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                      {(['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA'] as PaymentMethod[]).map(
                        (m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentMethod(m)}
                            className={`py-1.5 rounded-xl border text-[11px] font-bold transition text-center ${
                              paymentMethod === m
                                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {m}
                          </button>
                        ),
                      )}
                    </div>

                    {paymentMethod !== 'EFECTIVO' && (
                      <input
                        type="text"
                        value={operationCode}
                        onChange={(e) => setOperationCode(e.target.value)}
                        placeholder="Código de Operación digital (opcional)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nota o incidencia de la entrega (opcional)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      <span>Confirmar Entrega</span>
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

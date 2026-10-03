'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Receipt,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Order, DeliverOrderInput } from '../types/order';
import { orderService } from '../services/order-service';
import { PaymentMethod } from '@/features/cash/types/cash';
import { SaleType } from '@/features/sales/types/sale';
import { formatCurrency } from '@/lib/utils';
import { Modal, Button, Input } from '@/components/ui';

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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedSummary, setCompletedSummary] = useState<any | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (isNaN(bottlesDelivered) || bottlesDelivered < 0) {
      errs.bottlesDelivered = 'La cantidad de envases entregados no puede ser negativa.';
    }
    if (isNaN(bottlesReturned) || bottlesReturned < 0) {
      errs.bottlesReturned = 'La cantidad de envases devueltos no puede ser negativa.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setCompletedSummary(null);
        onClose();
      }}
      title={completedSummary ? '¡Pedido Entregado con Éxito!' : 'Completar Entrega de Pedido'}
      description={
        completedSummary
          ? `Venta registrada: ${completedSummary.sale?.saleNumber}`
          : `${order.orderNumber} — ${order.customer?.name}`
      }
      icon={completedSummary ? <CheckCircle2 className="w-5 h-5 text-slate-800" /> : <Receipt className="w-5 h-5 text-slate-800" />}
      iconColor="bg-slate-100"
      size="md"
    >
      {completedSummary ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total cobrado:</span>
              <span className="font-black text-slate-900 text-sm">
                {formatCurrency(completedSummary.sale?.total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Condición de pago:</span>
              <span className="font-bold text-slate-800">
                {completedSummary.sale?.saleType} ({paymentMethod})
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-700 font-semibold">
              <span>Custodia de bidones:</span>
              <span>
                {completedSummary.bottlesSummary?.returned} devueltos / {completedSummary.bottlesSummary?.delivered} entregados
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setCompletedSummary(null);
              onClose();
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            Finalizar y Cerrar
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

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">
                Monto Total a Cobrar
              </span>
              <span className="text-2xl font-black text-slate-900">
                {formatCurrency(order.total)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <Receipt className="w-6 h-6 text-slate-700" />
            </div>
          </div>

          {returnableCount > 0 && (
            <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>Control de Envases Retornables ({returnableCount} en pedido)</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Input
                  label="Llenos entregados:"
                  type="number"
                  min="0"
                  value={bottlesDelivered}
                  onChange={(e) => {
                    setBottlesDelivered(parseInt(e.target.value) || 0);
                    if (fieldErrors.bottlesDelivered) setFieldErrors((prev) => ({ ...prev, bottlesDelivered: '' }));
                  }}
                  className="text-center font-bold"
                  error={fieldErrors.bottlesDelivered}
                />
                <Input
                  label="Vacíos devueltos:"
                  type="number"
                  min="0"
                  value={bottlesReturned}
                  onChange={(e) => {
                    setBottlesReturned(parseInt(e.target.value) || 0);
                    if (fieldErrors.bottlesReturned) setFieldErrors((prev) => ({ ...prev, bottlesReturned: '' }));
                  }}
                  className="text-center font-bold"
                  error={fieldErrors.bottlesReturned}
                />
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSaleType('CONTADO')}
                className={`py-2 rounded-xl border transition ${
                  saleType === 'CONTADO'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Cobro al Contado
              </button>
              <button
                type="button"
                onClick={() => setSaleType('CREDITO')}
                className={`py-2 rounded-xl border transition ${
                  saleType === 'CREDITO'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                A Crédito
              </button>
            </div>

            {saleType === 'CONTADO' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-4 gap-1.5">
                  {(['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-1.5 text-[11px] font-bold rounded-lg border transition ${
                        paymentMethod === m
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {paymentMethod !== 'EFECTIVO' && (
                  <Input
                    label="Código de Operación Digital"
                    type="text"
                    value={operationCode}
                    onChange={(e) => setOperationCode(e.target.value)}
                    placeholder="Op. Yape / Plin / Transferencia"
                  />
                )}
              </div>
            )}
          </div>

          <Input
            label="Notas de la Entrega"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nota o incidencia de la entrega..."
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
              {isLoading ? 'Registrando...' : 'Confirmar Entrega'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

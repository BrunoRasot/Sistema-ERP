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

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedSummary, setCompletedSummary] = useState<any | null>(null);

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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setCompletedSummary(null);
        onClose();
      }}
      title={completedSummary ? '¡Pedido Entregado con Éxito!' : 'Completar Entrega'}
      description={
        completedSummary
          ? `Venta registrada: ${completedSummary.sale?.saleNumber}`
          : `${order.orderNumber} — ${order.customer?.name}`
      }
      icon={completedSummary ? <CheckCircle2 className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
      iconColor={completedSummary ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}
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
              <span className="font-bold text-blue-600">
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

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setCompletedSummary(null);
              onClose();
            }}
            className="w-full"
          >
            Finalizar
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

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 block uppercase">
                Monto Total del Pedido
              </span>
              <span className="text-xl font-black text-blue-900">
                {formatCurrency(order.total)}
              </span>
            </div>
            <Receipt className="w-6 h-6 text-blue-500" />
          </div>

          {returnableCount > 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <RotateCcw className="w-4 h-4" />
                <span>Control de Envases Retornables ({returnableCount} en pedido)</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Input
                  label="Llenos entregados:"
                  type="number"
                  min="0"
                  value={bottlesDelivered}
                  onChange={(e) => setBottlesDelivered(parseInt(e.target.value) || 0)}
                  className="text-center font-bold"
                />
                <Input
                  label="Vacíos devueltos:"
                  type="number"
                  min="0"
                  value={bottlesReturned}
                  onChange={(e) => setBottlesReturned(parseInt(e.target.value) || 0)}
                  className="text-center font-bold text-amber-900"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={saleType === 'CONTADO' ? 'primary' : 'outline'}
                onClick={() => setSaleType('CONTADO')}
                className="w-full"
              >
                Cobro al Contado
              </Button>
              <Button
                type="button"
                variant={saleType === 'CREDITO' ? 'primary' : 'outline'}
                onClick={() => setSaleType('CREDITO')}
                className="w-full"
              >
                A Crédito
              </Button>
            </div>

            {saleType === 'CONTADO' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-4 gap-1.5">
                  {(['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA'] as PaymentMethod[]).map((m) => (
                    <Button
                      key={m}
                      type="button"
                      size="xs"
                      variant={paymentMethod === m ? 'primary' : 'secondary'}
                      onClick={() => setPaymentMethod(m)}
                    >
                      {m}
                    </Button>
                  ))}
                </div>

                {paymentMethod !== 'EFECTIVO' && (
                  <Input
                    label="Código de Operación"
                    type="text"
                    value={operationCode}
                    onChange={(e) => setOperationCode(e.target.value)}
                    placeholder="Op. digital (opcional)"
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
            placeholder="Nota o incidencia de la entrega (opcional)..."
          />

          <div className="pt-2 flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="w-1/2">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              isLoading={isLoading}
              leftIcon={<Check className="w-4 h-4" />}
              className="w-1/2"
            >
              Confirmar Entrega
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

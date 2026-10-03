'use client';

import React, { useState } from 'react';
import { RotateCcw, Check, ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { Customer, BottleTransactionType } from '../types/customer';
import { customerService } from '../services/customer-service';
import { Modal, Button, Input } from '@/components/ui';

interface BottleMovementModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BottleMovementModal({
  customer,
  isOpen,
  onClose,
  onSuccess,
}: BottleMovementModalProps) {
  const [type, setType] = useState<BottleTransactionType>('DEVOLUCION');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectedHolding =
    type === 'ENTREGA'
      ? customer.bottlesHolding + quantity
      : Math.max(0, customer.bottlesHolding - quantity);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (isNaN(quantity) || quantity <= 0) {
      errs.quantity = 'La cantidad debe ser un número entero mayor a 0.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(null);

    try {
      await customerService.registerBottleMovement(customer.id, {
        type,
        quantity: Number(quantity),
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el movimiento de bidones');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Control de Bidones 20L"
      description={`Cliente: ${customer.name}`}
      icon={<RotateCcw className="w-5 h-5 text-slate-800" />}
      iconColor="bg-slate-100"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Envases en Custodia Actuales</span>
            <span className="text-xl font-black text-slate-900">{customer.bottlesHolding} bidones</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium block">Saldo Proyectado</span>
            <span className="text-xl font-black text-slate-900">{projectedHolding} bidones</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('DEVOLUCION')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              type === 'DEVOLUCION'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Devolución (Entra vacío)</span>
          </button>

          <button
            type="button"
            onClick={() => setType('ENTREGA')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              type === 'ENTREGA'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Préstamo / Entrega</span>
          </button>
        </div>

        <Input
          label="Cantidad de Bidones 20L"
          type="number"
          min="1"
          required
          value={quantity}
          onChange={(e) => {
            setQuantity(parseInt(e.target.value) || 0);
            if (fieldErrors.quantity) setFieldErrors((prev) => ({ ...prev, quantity: '' }));
          }}
          className="text-center text-xl font-black text-slate-900"
          error={fieldErrors.quantity}
        />

        <Input
          label="Motivo u Observación"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Devolución física al repartidor en entrega"
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
            {isLoading ? 'Registrando...' : 'Confirmar Movimiento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

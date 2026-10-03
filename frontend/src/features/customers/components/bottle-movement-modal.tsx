'use client';

import React, { useState } from 'react';
import { RotateCcw, Check, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectedHolding =
    type === 'ENTREGA'
      ? customer.bottlesHolding + quantity
      : Math.max(0, customer.bottlesHolding - quantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await customerService.registerBottleMovement(customer.id, {
        type,
        quantity,
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
      icon={<RotateCcw className="w-5 h-5" />}
      iconColor="bg-amber-50 text-amber-600"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Envases en Custodia Actuales</span>
            <span className="text-xl font-black text-slate-900">{customer.bottlesHolding} bidones</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium block">Saldo Proyectado</span>
            <span className="text-xl font-black text-blue-600">{projectedHolding} bidones</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={type === 'DEVOLUCION' ? 'success' : 'outline'}
            onClick={() => setType('DEVOLUCION')}
            leftIcon={<ArrowDownCircle className="w-4 h-4" />}
            className="w-full"
          >
            Devolución (Entra vacío)
          </Button>

          <Button
            type="button"
            variant={type === 'ENTREGA' ? 'primary' : 'outline'}
            onClick={() => setType('ENTREGA')}
            leftIcon={<ArrowUpCircle className="w-4 h-4" />}
            className="w-full"
          >
            Préstamo / Entrega
          </Button>
        </div>

        <Input
          label="Cantidad de Bidones 20L"
          type="number"
          min="1"
          max={type === 'DEVOLUCION' ? Math.max(1, customer.bottlesHolding) : 100}
          required
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="text-center text-lg font-black"
        />

        <Input
          label="Motivo u Observación"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Devolución de envases al repartidor"
        />

        <div className="pt-3 flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="w-1/2">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Check className="w-4 h-4" />}
            className="w-1/2"
          >
            Confirmar Movimiento
          </Button>
        </div>
      </form>
    </Modal>
  );
}

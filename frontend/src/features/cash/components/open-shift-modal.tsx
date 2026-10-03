'use client';

import React, { useState } from 'react';
import { Wallet, Check } from 'lucide-react';
import { CashRegister } from '../types/cash';
import { cashService } from '../services/cash-service';
import { Modal, Button, Input, Select } from '@/components/ui';

interface OpenShiftModalProps {
  registers: CashRegister[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OpenShiftModal({
  registers,
  isOpen,
  onClose,
  onSuccess,
}: OpenShiftModalProps) {
  const [cashRegisterId, setCashRegisterId] = useState(registers[0]?.id || '');
  const [initialBalance, setInitialBalance] = useState<number>(100);
  const [notes, setNotes] = useState<string>('Apertura turno con sencillo');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await cashService.openShift({
        cashRegisterId: cashRegisterId || registers[0]?.id,
        initialBalance: Number(initialBalance),
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al aperturar el turno de caja');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aperturar Turno de Caja"
      description="Ingresar saldo inicial en efectivo para sencillo"
      icon={<Wallet className="w-5 h-5" />}
      iconColor="bg-emerald-50 text-emerald-600"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium">
            {error}
          </div>
        )}

        <Select
          label="Caja Registradora"
          value={cashRegisterId}
          onChange={(e) => setCashRegisterId(e.target.value)}
          options={registers.map((r) => ({ value: r.id, label: r.name }))}
          required
        />

        <Input
          label="Saldo Inicial en Efectivo (S/)"
          type="number"
          min="0"
          step="5"
          required
          value={initialBalance}
          onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
          className="text-center text-lg font-black"
        />

        <Input
          label="Notas de Apertura"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Monedas y billetes chicos para vuelto"
        />

        <div className="pt-3 flex items-center gap-3">
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
            Abrir Caja
          </Button>
        </div>
      </form>
    </Modal>
  );
}

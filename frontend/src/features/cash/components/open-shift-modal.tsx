'use client';

import React, { useState } from 'react';
import { Wallet, Check, AlertCircle } from 'lucide-react';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!cashRegisterId && registers.length > 0) {
      errs.cashRegisterId = 'Seleccione una caja registradora.';
    }
    if (isNaN(initialBalance) || initialBalance < 0) {
      errs.initialBalance = 'El saldo inicial debe ser un número mayor o igual a 0.';
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
      icon={<Wallet className="w-5 h-5 text-slate-800" />}
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

        <Select
          label="Caja Registradora"
          value={cashRegisterId}
          onChange={(e) => {
            setCashRegisterId(e.target.value);
            if (fieldErrors.cashRegisterId) setFieldErrors((prev) => ({ ...prev, cashRegisterId: '' }));
          }}
          options={registers.map((r) => ({ value: r.id, label: r.name }))}
          required
          error={fieldErrors.cashRegisterId}
        />

        <Input
          label="Saldo Inicial en Efectivo (S/)"
          type="number"
          min="0"
          step="5"
          required
          value={initialBalance}
          onChange={(e) => {
            setInitialBalance(parseFloat(e.target.value) || 0);
            if (fieldErrors.initialBalance) setFieldErrors((prev) => ({ ...prev, initialBalance: '' }));
          }}
          className="text-center text-xl font-black text-slate-900"
          error={fieldErrors.initialBalance}
        />

        {/* Accesos rápidos de saldo inicial */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[50, 100, 150, 200].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setInitialBalance(val);
                if (fieldErrors.initialBalance) setFieldErrors((prev) => ({ ...prev, initialBalance: '' }));
              }}
              className={`py-1 text-xs font-bold rounded-lg border transition ${
                initialBalance === val
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              S/ {val}
            </button>
          ))}
        </div>

        <Input
          label="Notas u Observación de Apertura"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Monedas y billetes chicos para cambio"
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
            {isLoading ? 'Aperturando...' : 'Abrir Caja'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

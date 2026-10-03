'use client';

import React, { useState } from 'react';
import { Wallet, Check } from 'lucide-react';
import { CashShift } from '../types/cash';
import { cashService } from '../services/cash-service';
import { formatCurrency } from '@/lib/utils';
import { Modal, Button, Input } from '@/components/ui';

interface CloseShiftModalProps {
  shift: CashShift;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CloseShiftModal({
  shift,
  isOpen,
  onClose,
  onSuccess,
}: CloseShiftModalProps) {
  const expectedCash = shift.summary?.expectedCashInBox || Number(shift.initialBalance);
  const [actualBalance, setActualBalance] = useState<number>(expectedCash);
  const [notes, setNotes] = useState<string>('Arqueo conforme al cierre');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const difference = actualBalance - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await cashService.closeShift(shift.id, {
        actualBalance: Number(actualBalance),
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al cerrar el turno de caja');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cierre de Caja y Arqueo"
      description="Conciliación de efectivo físico al fin de turno"
      icon={<Wallet className="w-5 h-5" />}
      iconColor="bg-slate-900 text-white"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Saldo Inicial (Apertura):</span>
            <span className="font-semibold text-slate-800">{formatCurrency(shift.initialBalance)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Ventas en Efectivo (+):</span>
            <span className="font-semibold text-emerald-600">+{formatCurrency(shift.summary?.cashSalesTotal || 0)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Ingresos / Egresos Manuales:</span>
            <span className="font-semibold text-slate-700">
              {formatCurrency((shift.summary?.manualIncomes || 0) - (shift.summary?.manualExpenses || 0))}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
            <span className="text-slate-900">Saldo Esperado en Gaveta:</span>
            <span className="text-slate-900 font-black">{formatCurrency(expectedCash)}</span>
          </div>
        </div>

        <Input
          label="Efectivo Físico Contado en Caja (S/):"
          type="number"
          min="0"
          step="0.5"
          required
          value={actualBalance}
          onChange={(e) => setActualBalance(parseFloat(e.target.value) || 0)}
          className="text-center text-xl font-black"
        />

        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between font-semibold ${
            difference === 0
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : difference > 0
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>Diferencia de Arqueo:</span>
          <span className="font-black text-sm">
            {difference === 0
              ? 'S/ 0.00 (Cuadrado)'
              : difference > 0
              ? `+${formatCurrency(difference)} (Sobrante)`
              : `${formatCurrency(difference)} (Faltante)`}
          </span>
        </div>

        <Input
          label="Notas de Cierre"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Billetes revisados sin novedad"
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
            Confirmar Cierre
          </Button>
        </div>
      </form>
    </Modal>
  );
}

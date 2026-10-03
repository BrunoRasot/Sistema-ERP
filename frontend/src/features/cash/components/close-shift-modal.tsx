'use client';

import React, { useState } from 'react';
import { Wallet, X, Check, Loader2, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { CashShift } from '../types/cash';
import { cashService } from '../services/cash-service';
import { formatCurrency } from '@/lib/utils';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cierre de Caja y Arqueo</h3>
              <p className="text-xs text-slate-500 font-medium">Conciliación de efectivo físico al fin de turno</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Efectivo Físico Contado en Caja (S/):
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              required
              value={actualBalance}
              onChange={(e) => setActualBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-center text-xl font-black text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas de Cierre</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Billetes revisados sin novedad"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Cierre</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

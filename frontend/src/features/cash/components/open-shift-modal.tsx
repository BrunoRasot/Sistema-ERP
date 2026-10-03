'use client';

import React, { useState } from 'react';
import { Wallet, X, Check, Loader2 } from 'lucide-react';
import { CashRegister } from '../types/cash';
import { cashService } from '../services/cash-service';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Aperturar Turno de Caja</h3>
              <p className="text-xs text-slate-500 font-medium">Ingresar saldo inicial en efectivo para sencillo</p>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Caja Registradora</label>
            <select
              value={cashRegisterId}
              onChange={(e) => setCashRegisterId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {registers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Saldo Inicial en Efectivo (S/)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              required
              value={initialBalance}
              onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-center text-lg font-black text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas de Apertura</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Monedas y billetes chicos para vuelto"
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
              className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Abrir Caja</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

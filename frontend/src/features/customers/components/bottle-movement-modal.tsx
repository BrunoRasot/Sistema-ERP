'use client';

import React, { useState } from 'react';
import { RotateCcw, X, Check, Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Customer, BottleTransactionType } from '../types/customer';
import { customerService } from '../services/customer-service';

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

  if (!isOpen) return null;

  // Cálculo proyectado del nuevo saldo
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Control de Bidones</h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {customer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-800">Saldo en poder del cliente:</span>
              <p className="text-2xl font-black text-amber-900">{customer.bottlesHolding} bidones</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500 block">Proyección:</span>
              <span className="text-sm font-bold text-slate-800">
                ➔ {projectedHolding} {projectedHolding === 1 ? 'bidón' : 'bidones'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('DEVOLUCION')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${
                type === 'DEVOLUCION'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowDownCircle className="w-5 h-5" />
              <span>Devolución (Vacío)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('ENTREGA')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${
                type === 'ENTREGA'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowUpCircle className="w-5 h-5" />
              <span>Entrega (Lleno)</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Cantidad:</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuantity(num)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    quantity === num
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full mt-2 px-3 py-2 text-center text-sm font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones o Motivo (opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Recogidos en recepción / cambio de chofer"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
              className="w-1/2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

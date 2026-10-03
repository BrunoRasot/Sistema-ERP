'use client';

import React, { useState } from 'react';
import { X, Truck, Loader2, Check } from 'lucide-react';
import { Order, Driver } from '../types/order';
import { orderService } from '../services/order-service';

interface AssignDriverModalProps {
  order: Order;
  drivers: Driver[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignDriverModal({
  order,
  drivers,
  isOpen,
  onClose,
  onSuccess,
}: AssignDriverModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(order.driverId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setErrorMessage('Seleccione un repartidor');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await orderService.assignDriver(order.id, selectedDriverId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al asignar chofer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Asignar Repartidor</h3>
              <p className="text-xs text-slate-500">{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Seleccionar Chofer / Repartidor:
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {drivers.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No hay repartidores registrados en el sistema.
                </p>
              ) : (
                drivers.map((driver) => {
                  const isSelected = selectedDriverId === driver.id;
                  return (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-brand-50 border-brand-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {driver.firstName} {driver.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {driver.role.toLowerCase()} {driver.phone ? `· ${driver.phone}` : ''}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedDriverId}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Asignar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

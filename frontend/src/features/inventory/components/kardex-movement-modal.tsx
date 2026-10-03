'use client';

import React, { useState } from 'react';
import { Boxes, X, Check, Loader2, ArrowUpRight, ArrowDownRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { Product } from '@/features/products/types/product';
import { InventoryMovementType } from '../types/inventory';
import { inventoryService } from '../services/inventory-service';

interface KardexMovementModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function KardexMovementModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: KardexMovementModalProps) {
  const [movementType, setMovementType] = useState<InventoryMovementType>('ENTRADA');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Ingreso de producción purificada diaria');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Cálculo proyectado del stock final
  let projectedStock = product.stock;
  if (movementType === 'ENTRADA' || movementType === 'COMPRA' || movementType === 'DEVOLUCION') {
    projectedStock = product.stock + quantity;
  } else if (movementType === 'SALIDA' || movementType === 'MERMA') {
    projectedStock = Math.max(0, product.stock - quantity);
  } else if (movementType === 'AJUSTE') {
    projectedStock = quantity;
  }

  const handleTypeChange = (type: InventoryMovementType) => {
    setMovementType(type);
    if (type === 'ENTRADA') {
      setReason('Ingreso de producción purificada en planta');
    } else if (type === 'MERMA') {
      setReason('Envase fisurado o merma en planta');
    } else if (type === 'AJUSTE') {
      setReason('Ajuste por conteo físico de inventario');
      setQuantity(product.stock);
    } else {
      setReason('Salida manual de almacén');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await inventoryService.registerMovement({
        productId: product.id,
        movementType,
        quantity: Number(quantity),
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el movimiento en Kardex');
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
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Movimiento de Kardex</h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {product.code} — {product.name}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Stock físico actual:</span>
              <p className="text-2xl font-black text-slate-900">{product.stock} unid.</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-400 block">Stock Proyectado:</span>
              <span
                className={`text-base font-black ${
                  projectedStock <= product.minStock ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                ➔ {projectedStock} unid.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('ENTRADA')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                movementType === 'ENTRADA'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Entrada (Planta)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('MERMA')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                movementType === 'MERMA'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Merma (Dañado)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('AJUSTE')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                movementType === 'AJUSTE'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ajuste Físico</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              {movementType === 'AJUSTE' ? 'Nuevo Stock Físico Auditado:' : 'Cantidad de Unidades:'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[5, 10, 20, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuantity(movementType === 'AJUSTE' ? num : num)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                    quantity === num
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{num}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full mt-2 px-3 py-2 text-center text-sm font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo o Justificación Obligatoria:
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Lote de envasado matutino L-2909"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
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
                  <span>Confirmar Kardex</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

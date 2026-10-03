'use client';

import React, { useState } from 'react';
import { Boxes, Check, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Product } from '@/features/products/types/product';
import { InventoryMovementType } from '../types/inventory';
import { inventoryService } from '../services/inventory-service';
import { Modal, Button, Input } from '@/components/ui';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setFieldErrors({});
    if (type === 'ENTRADA') {
      setReason('Ingreso de producción purificada en planta');
    } else if (type === 'SALIDA' || type === 'MERMA') {
      setReason('Envase fisurado o merma en planta');
    } else if (type === 'AJUSTE') {
      setReason('Ajuste por conteo físico de inventario');
      setQuantity(product.stock);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (isNaN(quantity) || quantity <= 0) {
      errs.quantity = 'La cantidad debe ser un número entero mayor a 0.';
    }

    if (!reason.trim()) {
      errs.reason = 'El motivo u observación es obligatorio.';
    } else if (reason.trim().length < 3) {
      errs.reason = 'El motivo debe tener al menos 3 caracteres.';
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
      await inventoryService.registerMovement({
        productId: product.id,
        movementType,
        quantity: Number(quantity),
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el movimiento en el Kardex');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajuste de Kardex e Inventario"
      description={`${product.code} — ${product.name}`}
      icon={<Boxes className="w-5 h-5 text-slate-800" />}
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
            <span className="text-xs text-slate-500 font-medium block">Stock Físico Actual</span>
            <span className="text-xl font-black text-slate-900">{product.stock} un.</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium block">Stock Resultante</span>
            <span
              className={`text-xl font-black ${
                projectedStock < (product.minStock || 10) ? 'text-amber-800' : 'text-slate-900'
              }`}
            >
              {projectedStock} un.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange('ENTRADA')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              movementType === 'ENTRADA'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Entrada</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('SALIDA')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              movementType === 'SALIDA'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Salida</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('AJUSTE')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              movementType === 'AJUSTE'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Ajuste</span>
          </button>
        </div>

        <Input
          label={movementType === 'AJUSTE' ? 'Nuevo Stock Total Contado' : 'Cantidad a Mover'}
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
          label="Motivo u Observación del Movimiento"
          type="text"
          required
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (fieldErrors.reason) setFieldErrors((prev) => ({ ...prev, reason: '' }));
          }}
          placeholder="Ej: Ingreso de producción por lote 2026-A"
          error={fieldErrors.reason}
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

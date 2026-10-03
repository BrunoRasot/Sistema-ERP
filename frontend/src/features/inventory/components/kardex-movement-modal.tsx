'use client';

import React, { useState } from 'react';
import { Boxes, Check, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
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
        reason: reason.trim() || 'Ajuste de inventario',
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
      icon={<Boxes className="w-5 h-5" />}
      iconColor="bg-blue-50 text-blue-600"
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
            <span className="text-xs text-slate-500 font-medium block">Stock Físico Actual</span>
            <span className="text-xl font-black text-slate-900">{product.stock} un.</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium block">Stock Resultante</span>
            <span
              className={`text-xl font-black ${
                projectedStock < (product.minStock || 10) ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {projectedStock} un.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={movementType === 'ENTRADA' ? 'success' : 'outline'}
            onClick={() => handleTypeChange('ENTRADA')}
            leftIcon={<ArrowUpRight className="w-4 h-4" />}
            className="w-full text-xs"
          >
            Entrada
          </Button>
          <Button
            type="button"
            variant={movementType === 'SALIDA' ? 'danger' : 'outline'}
            onClick={() => handleTypeChange('SALIDA')}
            leftIcon={<ArrowDownRight className="w-4 h-4" />}
            className="w-full text-xs"
          >
            Salida
          </Button>
          <Button
            type="button"
            variant={movementType === 'AJUSTE' ? 'primary' : 'outline'}
            onClick={() => handleTypeChange('AJUSTE')}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="w-full text-xs"
          >
            Ajuste
          </Button>
        </div>

        <Input
          label={movementType === 'AJUSTE' ? 'Nuevo Stock Total Contado' : 'Cantidad a Mover'}
          type="number"
          min="1"
          required
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          className="text-center text-lg font-black"
        />

        <Input
          label="Motivo / Justificación del Movimiento"
          type="text"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Lote de producción terminado, merma por rotura"
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
            Registrar Movimiento
          </Button>
        </div>
      </form>
    </Modal>
  );
}

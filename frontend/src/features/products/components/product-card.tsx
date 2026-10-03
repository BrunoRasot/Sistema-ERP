'use client';

import React from 'react';
import {
  RotateCcw,
  AlertTriangle,
  Boxes,
  Edit3,
  Power,
} from 'lucide-react';
import { Product } from '../types/product';
import { formatCurrency } from '@/lib/utils';
import { Badge, Button } from '@/components/ui';

interface ProductCardProps {
  product: Product;
  onOpenMovementModal: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

export function ProductCard({
  product,
  onOpenMovementModal,
  onEditProduct,
  onToggleStatus,
}: ProductCardProps) {
  const isCritical = product.stock <= product.minStock;
  const isInactive = product.status === 'INACTIVE';
  const unitLabels: Record<string, string> = {
    BIDON_20L: 'Bidón 20L',
    BIDON_10L: 'Bidón 10L',
    UNIDAD: 'Unidad',
    CAJA: 'Caja',
    PAQUETE: 'Paquete',
    LITRO: 'Litro',
  };

  return (
    <div
      className={`bg-white rounded-2xl border shadow-xs p-4 hover:shadow-md transition space-y-3.5 flex flex-col justify-between ${
        isInactive ? 'border-slate-300 bg-slate-50/60 opacity-75' : 'border-slate-200'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="default" size="sm">
              {product.code}
            </Badge>

            {isInactive ? (
              <Badge variant="danger" size="sm">
                Deshabilitado
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                Activo
              </Badge>
            )}

            {product.isReturnable ? (
              <Badge variant="warning" size="sm">
                <RotateCcw className="w-3 h-3 mr-0.5 inline" />
                Retornable
              </Badge>
            ) : (
              <Badge variant="primary" size="sm">
                Descartable
              </Badge>
            )}
          </div>

          <span className="text-[11px] font-medium text-slate-400 shrink-0">
            {product.category?.name || 'General'}
          </span>
        </div>

        <div>
          <h3 className={`text-base font-bold leading-snug ${isInactive ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {product.description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Stock en Almacén:</span>
          <div className="flex items-center gap-1.5">
            {isCritical && (
              <span title="Stock Crítico" className="text-rose-500 flex items-center gap-0.5 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3" />
                Crítico
              </span>
            )}
            <Badge variant={isCritical ? 'danger' : 'success'} size="md">
              {product.stock} {unitLabels[product.unit] || product.unit}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Precio Venta:</span>
            <span className="font-extrabold text-blue-700 text-base">
              {formatCurrency(product.price)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Costo Ref.:</span>
            <span className="font-semibold text-slate-600 text-xs">
              {formatCurrency(product.cost)}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de Acción (Editar Precio, Ajustar Stock, Activar/Desactivar) */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEditProduct(product)}
          icon={<Edit3 className="w-3.5 h-3.5" />}
        >
          Editar Precio
        </Button>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenMovementModal(product)}
            icon={<Boxes className="w-3.5 h-3.5" />}
            title="Ajustar stock en kardex"
          >
            Kardex
          </Button>

          <Button
            size="sm"
            variant={isInactive ? 'primary' : 'ghost'}
            onClick={() => onToggleStatus(product)}
            icon={<Power className="w-3.5 h-3.5" />}
            title={isInactive ? 'Habilitar producto en catálogo' : 'Deshabilitar producto del catálogo'}
          >
            {isInactive ? 'Habilitar' : 'Deshabilitar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

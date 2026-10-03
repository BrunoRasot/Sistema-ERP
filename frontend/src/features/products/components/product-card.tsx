'use client';

import React from 'react';
import {
  Package,
  RotateCcw,
  AlertTriangle,
  Boxes,
  PlusCircle,
  Tag,
} from 'lucide-react';
import { Product } from '../types/product';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onOpenMovementModal: (product: Product) => void;
}

export function ProductCard({ product, onOpenMovementModal }: ProductCardProps) {
  const isCritical = product.stock <= product.minStock;
  const unitLabels: Record<string, string> = {
    BIDON_20L: 'Bidón 20L',
    BIDON_10L: 'Bidón 10L',
    UNIDAD: 'Unidad',
    CAJA: 'Caja',
    PAQUETE: 'Paquete',
    LITRO: 'Litro',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition space-y-3.5 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
              {product.code}
            </span>

            {product.isReturnable ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <RotateCcw className="w-3 h-3" />
                Retornable
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Descartable
              </span>
            )}
          </div>

          <span className="text-[11px] font-medium text-slate-400 shrink-0">
            {product.category?.name || 'General'}
          </span>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">
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
            <span
              className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                isCritical
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {product.stock} {unitLabels[product.unit] || product.unit}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Precio Venta:</span>
            <span className="font-extrabold text-slate-900 text-sm">
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

      {/* Botón de Acción Rápida (Kardex / Movimiento) */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Mín. alerta: <strong className="text-slate-700">{product.minStock}</strong>
        </span>

        <button
          onClick={() => onOpenMovementModal(product)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95 shadow-sm"
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Ajustar Stock</span>
        </button>
      </div>
    </div>
  );
}

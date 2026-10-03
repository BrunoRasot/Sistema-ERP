'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  RotateCcw,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Calendar,
  Plus,
} from 'lucide-react';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import { productService } from '@/features/products/services/product-service';
import { Product } from '@/features/products/types/product';
import { KardexMovementModal } from '@/features/inventory/components/kardex-movement-modal';
import { formatCurrency } from '@/lib/utils';
import { SkeletonMobileCard, SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [movementFilter, setMovementFilter] = useState<string>('');
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  // Consulta de resumen valorizado
  const { data: summary } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => inventoryService.getSummary(),
  });

  // Consulta de productos para el modal
  const { data: productsData } = useQuery({
    queryKey: ['products-for-kardex'],
    queryFn: () => productService.getProducts({ limit: 100 }),
  });

  const products = productsData?.data || [];

  // Consulta del Kardex
  const { data: kardexData, isLoading, refetch } = useQuery({
    queryKey: ['kardex', { movementFilter }],
    queryFn: () =>
      inventoryService.getKardex({
        movementType: movementFilter || undefined,
        limit: 50,
      }),
  });

  const movements = kardexData?.data || [];
  const totalMovements = kardexData?.meta?.total || 0;

  const movementBadge: Record<string, { label: string; bg: string; icon: any }> = {
    ENTRADA: { label: 'Entrada', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowUpRight },
    SALIDA: { label: 'Salida', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: ArrowDownRight },
    AJUSTE: { label: 'Ajuste', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: RefreshCw },
    MERMA: { label: 'Merma', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
    VENTA: { label: 'Venta', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: ArrowDownRight },
    COMPRA: { label: 'Compra', bg: 'bg-teal-50 text-teal-700 border-teal-200', icon: ArrowUpRight },
    DEVOLUCION: { label: 'Devolución', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: RotateCcw },
  };

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Inventario y Kardex
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control físico de planta, auditoría de stock y valorización de mercadería
          </p>
        </div>

        {products.length > 0 && (
          <button
            onClick={() => setSelectedProductForMovement(products[0])}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 self-start sm:self-auto"
          >
            <Boxes className="w-4 h-4" />
            <span>Registrar Movimiento de Planta</span>
          </button>
        )}
      </div>

      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="card p-3 sm:p-3.5">
          <span className="text-xs font-semibold text-slate-500">Valorizado al Costo</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
            {formatCurrency(summary?.totalValuedAtCost || 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            Costo de adquisición/producción
          </span>
        </div>

        <div className="card p-3 sm:p-3.5">
          <span className="text-xs font-semibold text-slate-500">Valor Proyectado Venta</span>
          <p className="text-lg sm:text-xl font-bold text-blue-600 mt-0.5">
            {formatCurrency(summary?.totalValuedAtPrice || 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            Valor a precio de lista
          </span>
        </div>

        <div className="card p-3 sm:p-3.5">
          <span className="text-xs font-semibold text-slate-500">Stock Físico Total</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
            {summary?.totalUnitsInWarehouse || 0} unid.
          </p>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            En {summary?.totalSkus || 0} SKUs registrados
          </span>
        </div>

        <div className="card p-3 sm:p-3.5">
          <span className="text-xs font-semibold text-slate-500">Bidones Llenos en Planta</span>
          <p className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5">
            {summary?.returnableUnitsInWarehouse || 0} unid.
          </p>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            Listos para cargar a ruta
          </span>
        </div>
      </div>

      {/* Filtros del Kardex */}
      <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Historial de Movimientos de Kardex</h2>
          <span className="text-xs text-slate-400">{totalMovements} registros</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          <button
            onClick={() => setMovementFilter('')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              movementFilter === ''
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setMovementFilter('ENTRADA')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              movementFilter === 'ENTRADA'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Entradas (Producción)
          </button>
          <button
            onClick={() => setMovementFilter('SALIDA')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              movementFilter === 'SALIDA'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Salidas
          </button>
          <button
            onClick={() => setMovementFilter('AJUSTE')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              movementFilter === 'AJUSTE'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            Ajustes de Conteo
          </button>
          <button
            onClick={() => setMovementFilter('MERMA')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              movementFilter === 'MERMA'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            Mermas
          </button>
        </div>
      </div>

      {/* Lista / Tabla de Kardex */}
      {isLoading ? (
        <>
          <div className="lg:hidden space-y-2.5">
            <SkeletonMobileCard />
            <SkeletonMobileCard />
            <SkeletonMobileCard />
          </div>
          <div className="hidden lg:flex flex-1 min-h-0">
            <SkeletonTable rows={8} cols={7} />
          </div>
        </>
      ) : movements.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
          <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No hay movimientos registrados en el Kardex</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Los movimientos de producción, ventas y mermas se registrarán aquí automáticamente.
          </p>
          {products.length > 0 && (
            <button
              onClick={() => setSelectedProductForMovement(products[0])}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition active:scale-95"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Registrar Movimiento de Planta</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Vista Móvil (< lg): Cards Táctiles de Kardex */}
          <div className="lg:hidden space-y-3">
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {movements.map((m) => {
                const badge = movementBadge[m.movementType] || { label: m.movementType, bg: 'bg-slate-100 text-slate-700', icon: Boxes };
                const Icon = badge.icon;
                const dateStr = new Date(m.createdAt).toLocaleString('es-PE', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                });

                return (
                  <div key={m.id} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{m.product?.name}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        <Icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </div>
                    {m.reason && <p className="text-xs text-slate-500">{m.reason}</p>}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-400 text-[11px]">{dateStr}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-400 text-xs">
                          {m.previousStock} ➔
                        </span>
                        <span className="font-black text-slate-900 text-xs">
                          {m.newStock} unid.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-slate-400 font-medium py-2">
              Mostrando {movements.length} movimientos de Kardex
            </div>
          </div>

          {/* Vista Desktop (>= lg): Tabla Formal de Kardex con Scroll Solo en Filas */}
          <div className="hidden lg:flex flex-1 min-h-0 flex-col card overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider shadow-2xs">
                  <tr>
                    <th className="py-3 px-4 bg-slate-50">Fecha / Hora</th>
                    <th className="py-3 px-4 bg-slate-50">Producto</th>
                    <th className="py-3 px-4 bg-slate-50">Tipo</th>
                    <th className="py-3 px-4 bg-slate-50 text-center">Variación</th>
                    <th className="py-3 px-4 bg-slate-50 text-center">Stock Final</th>
                    <th className="py-3 px-4 bg-slate-50">Motivo / Documento</th>
                    <th className="py-3 px-4 bg-slate-50">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => {
                    const badge = movementBadge[m.movementType] || { label: m.movementType, bg: 'bg-slate-100 text-slate-700', icon: Boxes };
                    const Icon = badge.icon;
                    const dateStr = new Date(m.createdAt).toLocaleString('es-PE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    });

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">{dateStr}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{m.product?.name}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-sm whitespace-nowrap">
                          <span className={m.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-black text-slate-900 text-sm whitespace-nowrap">
                          {m.newStock}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={m.reason}>
                          {m.reason}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {m.user?.firstName || 'Sistema'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Mostrando {movements.length} movimientos de Kardex</span>
              <span>Auditoría de Almacén</span>
            </div>
          </div>
        </>
      )}

      {products.length > 0 && (
        <button
          onClick={() => setSelectedProductForMovement(products[0])}
          className="lg:hidden fixed right-4 bottom-20 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
          title="Registrar Movimiento"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Movimiento</span>
        </button>
      )}

      {selectedProductForMovement && (
        <KardexMovementModal
          product={selectedProductForMovement}
          isOpen={!!selectedProductForMovement}
          onClose={() => setSelectedProductForMovement(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['kardex'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Movimiento registrado con éxito', 'El Kardex y stock se actualizaron correctamente');
          }}
        />
      )}
    </div>
  );
}

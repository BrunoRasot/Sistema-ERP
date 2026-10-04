'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  Plus,
  Package,
} from 'lucide-react';
import { inventoryService } from '@/features/inventory/services/inventory-service';
import { productService } from '@/features/products/services/product-service';
import { Product } from '@/features/products/types/product';
import { KardexMovementModal } from '@/features/inventory/components/kardex-movement-modal';
import { formatCurrency } from '@/lib/utils';
import { SkeletonMobileCard, SkeletonTable } from '@/components/ui/skeleton';
import {
  Button,
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
  useToast,
} from '@/components/ui';

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

  const movementBadge: Record<string, { label: string; variant: 'success' | 'danger' | 'info' | 'warning' | 'primary' | 'purple' | 'default' }> = {
    ENTRADA: { label: 'Entrada', variant: 'success' },
    SALIDA: { label: 'Salida', variant: 'danger' },
    AJUSTE: { label: 'Ajuste', variant: 'info' },
    MERMA: { label: 'Merma', variant: 'warning' },
    VENTA: { label: 'Venta', variant: 'primary' },
    COMPRA: { label: 'Compra', variant: 'success' },
    DEVOLUCION: { label: 'Devolución', variant: 'purple' },
  };

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <PageHeader
        title="Inventario y Kardex"
        description="Control físico de planta, auditoría de stock y valorización de mercadería"
        actions={
          products.length > 0 ? (
            <Button
              variant="primary"
              icon={<Boxes className="w-4 h-4" />}
              onClick={() => setSelectedProductForMovement(products[0])}
            >
              Registrar Movimiento
            </Button>
          ) : undefined
        }
      />

      {/* Tarjetas de Valorización de Inventario */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard
          label="Valorizado al Costo"
          value={formatCurrency(summary?.totalValuedAtCost || 0)}
          subtitle="Costo de producción/compra"
          icon={<Package className="w-5 h-5" />}
          iconColor="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Valor Proyectado Venta"
          value={formatCurrency(summary?.totalValuedAtPrice || 0)}
          subtitle="Valor a precio de lista"
          icon={<ArrowUpRight className="w-5 h-5" />}
          iconColor="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          label="Stock Físico Total"
          value={`${summary?.totalUnitsInWarehouse || 0} unid.`}
          subtitle={`En ${summary?.totalSkus || 0} SKUs registrados`}
          icon={<Boxes className="w-5 h-5" />}
          iconColor="bg-purple-50 text-purple-600"
        />

        <StatCard
          label="Bidones Llenos en Planta"
          value={`${summary?.returnableUnitsInWarehouse || 0} unid.`}
          subtitle="Disponibles para despacho"
          icon={<RotateCcw className="w-5 h-5" />}
          iconColor="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Filtros del Kardex */}
      <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Historial de Movimientos de Kardex</h2>
          <span className="text-xs text-slate-400 font-medium">{totalMovements} registros</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          {[
            { label: 'Todos', value: '' },
            { label: 'Entradas (Producción)', value: 'ENTRADA' },
            { label: 'Salidas', value: 'SALIDA' },
            { label: 'Ajustes de Conteo', value: 'AJUSTE' },
            { label: 'Mermas', value: 'MERMA' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMovementFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                movementFilter === tab.value
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
        <EmptyState
          icon={<Boxes className="w-8 h-8" />}
          title="No hay movimientos registrados en el Kardex"
          description="Los movimientos de producción, ventas y mermas se registrarán aquí automáticamente."
          action={
            products.length > 0 ? (
              <Button
                variant="primary"
                size="sm"
                icon={<Boxes className="w-4 h-4" />}
                onClick={() => setSelectedProductForMovement(products[0])}
              >
                Registrar Movimiento de Planta
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Vista Móvil */}
          <div className="lg:hidden space-y-3">
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {movements.map((m) => {
                const badge = movementBadge[m.movementType] || { label: m.movementType, variant: 'default' as const };
                const dateStr = new Date(m.createdAt).toLocaleString('es-PE', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                });

                return (
                  <div key={m.id} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{m.product?.name}</span>
                      <Badge variant={badge.variant}>
                        {badge.label}
                      </Badge>
                    </div>
                    {m.reason && <p className="text-xs text-slate-500 font-medium">{m.reason}</p>}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-400 text-[11px]">{dateStr}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-400 text-xs">
                          {m.previousStock} ➔
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
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

          {/* Tabla Desktop */}
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
                    const badge = movementBadge[m.movementType] || { label: m.movementType, variant: 'default' as const };
                    const dateStr = new Date(m.createdAt).toLocaleString('es-PE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    });

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">{dateStr}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{m.product?.name}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant={badge.variant}>
                            {badge.label}
                          </Badge>
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
            toast.success('Movimiento registrado', 'El Kardex y stock físico se actualizaron.');
          }}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Search,
  PlusCircle,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Settings,
} from 'lucide-react';
import { productService } from '@/features/products/services/product-service';
import { Product } from '@/features/products/types/product';
import { CreateProductModal } from '@/features/products/components/create-product-modal';
import { KardexMovementModal } from '@/features/inventory/components/kardex-movement-modal';
import { ProductCard } from '@/features/products/components/product-card';
import { formatCurrency } from '@/lib/utils';

const UNIT_LABELS: Record<string, string> = {
  UNIDAD: 'Unidad',
  BIDON_20L: 'Bidón 20L',
  BIDON_10L: 'Bidón 10L',
  CAJA: 'Caja',
  PAQUETE: 'Paquete',
  LITRO: 'Litro',
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RETURNABLE' | 'LOW_STOCK'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { search, filterType }],
    queryFn: () =>
      productService.getProducts({
        search: search.trim() || undefined,
        isReturnable: filterType === 'RETURNABLE' ? true : undefined,
        isLowStock: filterType === 'LOW_STOCK' ? true : undefined,
        limit: 50,
      }),
  });

  const products: Product[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? (data as unknown as Product[])
    : [];

  const total = data?.meta?.total ?? products.length;
  const returnableCount = products.filter((p) => p.isReturnable).length;
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Catálogo de Productos</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Línea de agua purificada, envases retornables, bidones y accesorios
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Productos en Catálogo</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{total} SKUs</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600"><Package className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        </div>
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Línea Retornable</span>
            <p className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5">{returnableCount} ítems</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 text-amber-600"><RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        </div>
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Stock Crítico (Alerta)</span>
            <p className={`text-lg sm:text-xl font-bold mt-0.5 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {lowStockCount} ítems
            </p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        </div>
      </div>

      <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código SKU, nombre o descripción..."
            className="input pl-10 pr-4 py-2.5 text-xs sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos ({total})
          </button>
          <button
            onClick={() => setFilterType('RETURNABLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'RETURNABLE'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /><span>Retornables</span>
          </button>
          <button
            onClick={() => setFilterType('LOW_STOCK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'LOW_STOCK'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /><span>Stock Crítico ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Cargando catálogo...</span>
        </div>
      ) : isError ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-600">Error al consultar el catálogo.</p>
          <button onClick={() => refetch()} className="btn btn-secondary text-xs">
            Reintentar
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="card py-16 text-center border-dashed p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? `No hay resultados para "${search}".` : 'No hay productos registrados con el filtro actual.'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700"
          >
            <PlusCircle className="w-4 h-4" /><span>Crear Primer Producto</span>
          </button>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenMovementModal={(p) => setSelectedProductForMovement(p)}
              />
            ))}
            <div className="text-center text-xs text-slate-400 font-medium py-2">
              Mostrando {products.length} de {total} productos
            </div>
          </div>

          <div className="hidden lg:flex flex-1 min-h-0 flex-col card overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider shadow-2xs">
                  <tr>
                    <th className="px-4 py-3 bg-slate-50">Código SKU</th>
                    <th className="px-4 py-3 bg-slate-50">Producto</th>
                    <th className="px-4 py-3 bg-slate-50">Categoría</th>
                    <th className="px-4 py-3 bg-slate-50">Tipo / Unidad</th>
                    <th className="px-4 py-3 bg-slate-50 text-right">Precio Venta</th>
                    <th className="px-4 py-3 bg-slate-50 text-right">Costo Ref.</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Stock</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Mín. Alerta</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Estado</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const isLow = product.stock <= product.minStock;
                    return (
                      <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{product.code}</td>
                        <td className="px-4 py-3 min-w-[200px]">
                          <p className="font-bold text-slate-900 leading-tight">{product.name}</p>
                          {product.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[220px]">{product.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {product.category?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[11px] font-semibold text-slate-500">
                            {UNIT_LABELS[product.unit] ?? product.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(Number(product.price))}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                          {formatCurrency(Number(product.cost))}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                              isLow
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {product.stock}{' '}
                            <span className="ml-1 font-normal opacity-70">
                              {UNIT_LABELS[product.unit] ?? product.unit}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{product.minStock}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            {product.isReturnable && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
                                <RotateCcw className="w-2.5 h-2.5" /> Retornable
                              </span>
                            )}
                            {isLow && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold">
                                <AlertTriangle className="w-2.5 h-2.5" /> Stock bajo
                              </span>
                            )}
                            {!product.isReturnable && !isLow && (
                              <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">
                                Normal
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedProductForMovement(product)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition"
                          >
                            <Settings className="w-3 h-3" />
                            Ajustar Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Mostrando {products.length} de {total} productos</span>
              <span>Catálogo Ica</span>
            </div>
          </div>
        </>
      )}

      <CreateProductModal
        categories={categories}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
        }}
      />

      {selectedProductForMovement && (
        <KardexMovementModal
          product={selectedProductForMovement}
          isOpen={!!selectedProductForMovement}
          onClose={() => setSelectedProductForMovement(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
            queryClient.invalidateQueries({ queryKey: ['kardex'] });
          }}
        />
      )}
    </div>
  );
}

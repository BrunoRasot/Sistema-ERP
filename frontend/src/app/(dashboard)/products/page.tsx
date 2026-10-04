'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  PlusCircle,
  RotateCcw,
  AlertTriangle,
  Settings,
  Edit3,
  Power,
} from 'lucide-react';
import { productService } from '@/features/products/services/product-service';
import { Product } from '@/features/products/types/product';
import { CreateProductModal } from '@/features/products/components/create-product-modal';
import { EditProductModal } from '@/features/products/components/edit-product-modal';
import { KardexMovementModal } from '@/features/inventory/components/kardex-movement-modal';
import { ProductCard } from '@/features/products/components/product-card';
import { formatCurrency } from '@/lib/utils';
import {
  Button,
  SearchInput,
  LoadingState,
  EmptyState,
  PageHeader,
  StatCard,
  Badge,
  ConfirmDialog,
  useToast,
} from '@/components/ui';

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
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'RETURNABLE' | 'LOW_STOCK'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);
  const [productToToggleStatus, setProductToToggleStatus] = useState<Product | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { search, filterType }],
    queryFn: () =>
      productService.getProducts({
        search: search.trim() || undefined,
        status: filterType === 'ACTIVE' ? 'ACTIVE' : filterType === 'INACTIVE' ? 'INACTIVE' : undefined,
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

  const handleConfirmToggleStatus = async () => {
    if (!productToToggleStatus) return;
    const newStatus = productToToggleStatus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      setIsTogglingStatus(true);
      await productService.updateProduct(productToToggleStatus.id, { status: newStatus });
      toast.success(
        newStatus === 'ACTIVE' ? 'Producto habilitado' : 'Producto deshabilitado',
        `"${productToToggleStatus.name}" fue actualizado correctamente.`,
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      setProductToToggleStatus(null);
    } catch (err: any) {
      toast.error('Error al actualizar estado', err?.message || 'No se pudo cambiar el estado');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <PageHeader
        title="Catálogo de Productos"
        description="Línea de agua purificada, envases retornables, bidones y accesorios"
        actions={
          <Button
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nuevo Producto
          </Button>
        }
      />

      {/* Grid de Métricas de Catálogo */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Productos en Catálogo"
          value={`${total} SKUs`}
          subtitle="Registrados en el sistema"
          icon={<Package className="w-5 h-5" />}
          iconColor="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Línea Retornable"
          value={`${returnableCount} ítems`}
          subtitle="Envases con control de préstamo"
          icon={<RotateCcw className="w-5 h-5" />}
          iconColor="bg-amber-50 text-amber-600"
        />

        <StatCard
          label="Stock Crítico (Alerta)"
          value={`${lowStockCount} ítems`}
          subtitle="Por debajo del umbral mínimo"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor={lowStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}
        />
      </div>

      {/* Filtros y Búsqueda */}
      <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código SKU, nombre o descripción..."
        />
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
            onClick={() => setFilterType('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'ACTIVE'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilterType('INACTIVE')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'INACTIVE'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Deshabilitados
          </button>
          <button
            onClick={() => setFilterType('RETURNABLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'RETURNABLE'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retornables</span>
          </button>
          <button
            onClick={() => setFilterType('LOW_STOCK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'LOW_STOCK'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Stock Crítico ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="Cargando catálogo..." />
      ) : isError ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-600">Error al consultar el catálogo.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No se encontraron productos"
          description={search ? `No hay resultados para "${search}".` : 'No hay productos registrados con el filtro actual.'}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Crear Primer Producto
            </Button>
          }
        />
      ) : (
        <>
          {/* Vista móvil */}
          <div className="lg:hidden space-y-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenMovementModal={(p) => setSelectedProductForMovement(p)}
                onEditProduct={(p) => setProductToEdit(p)}
                onToggleStatus={(p) => setProductToToggleStatus(p)}
              />
            ))}
            <div className="text-center text-xs text-slate-400 font-medium py-2">
              Mostrando {products.length} de {total} productos
            </div>
          </div>

          {/* Tabla desktop */}
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
                    const isInactive = product.status === 'INACTIVE';
                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isInactive ? 'bg-slate-50/40 text-slate-400' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{product.code}</td>
                        <td className="px-4 py-3 min-w-[200px]">
                          <p className={`font-bold leading-tight ${isInactive ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {product.name}
                          </p>
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
                            <Badge variant={product.status === 'ACTIVE' ? 'success' : 'danger'}>
                              {product.status === 'ACTIVE' ? 'Activo' : 'Deshabilitado'}
                            </Badge>
                            {product.isReturnable && (
                              <Badge variant="warning" size="sm">
                                Retornable
                              </Badge>
                            )}
                            {isLow && (
                              <Badge variant="danger" size="sm">
                                Stock bajo
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setProductToEdit(product)}
                              title="Modificar precio y detalles del producto"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-lg transition shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              Editar
                            </button>
                            <button
                              onClick={() => setSelectedProductForMovement(product)}
                              title="Ajustar Stock en Kardex"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-lg transition shadow-2xs"
                            >
                              <Settings className="w-3.5 h-3.5 text-slate-500" />
                              Stock
                            </button>
                            <button
                              onClick={() => setProductToToggleStatus(product)}
                              title={product.status === 'ACTIVE' ? 'Deshabilitar producto para ventas' : 'Habilitar producto'}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition shadow-2xs ${
                                product.status === 'ACTIVE'
                                  ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              {product.status === 'ACTIVE' ? 'Deshabilitar' : 'Habilitar'}
                            </button>
                          </div>
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

      {/* Modales */}
      <CreateProductModal
        categories={categories}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          toast.success('Producto creado', 'El nuevo SKU fue añadido al catálogo.');
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
        }}
      />

      <EditProductModal
        product={productToEdit}
        categories={categories}
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        onSuccess={() => {
          toast.success('Producto modificado', 'Los datos del producto se guardaron correctamente.');
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
          queryClient.invalidateQueries({ queryKey: ['products-pos'] });
        }}
      />

      {selectedProductForMovement && (
        <KardexMovementModal
          product={selectedProductForMovement}
          isOpen={!!selectedProductForMovement}
          onClose={() => setSelectedProductForMovement(null)}
          onSuccess={() => {
            toast.success('Movimiento registrado', 'El Kardex y stock se actualizaron.');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
            queryClient.invalidateQueries({ queryKey: ['kardex'] });
          }}
        />
      )}

      {/* Confirmación para cambiar estado */}
      <ConfirmDialog
        isOpen={!!productToToggleStatus}
        onClose={() => setProductToToggleStatus(null)}
        onConfirm={handleConfirmToggleStatus}
        isLoading={isTogglingStatus}
        title={productToToggleStatus?.status === 'ACTIVE' ? '¿Deshabilitar producto?' : '¿Habilitar producto?'}
        description={
          productToToggleStatus?.status === 'ACTIVE'
            ? `¿Deseas deshabilitar "${productToToggleStatus.name}"? El producto ya no estará disponible para ventas en el Terminal POS.`
            : `¿Deseas habilitar "${productToToggleStatus?.name}" para que esté disponible en ventas y pedidos?`
        }
        confirmText={productToToggleStatus?.status === 'ACTIVE' ? 'Sí, deshabilitar' : 'Sí, habilitar'}
        variant={productToToggleStatus?.status === 'ACTIVE' ? 'warning' : 'primary'}
      />
    </div>
  );
}

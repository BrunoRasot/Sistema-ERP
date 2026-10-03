'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { orderService } from '@/features/orders/services/order-service';
import { customerService } from '@/features/customers/services/customer-service';
import { productService } from '@/features/products/services/product-service';
import { Order, OrderStatus } from '@/features/orders/types/order';
import { CreateOrderModal } from '@/features/orders/components/create-order-modal';
import { AssignDriverModal } from '@/features/orders/components/assign-driver-modal';
import { DeliverOrderModal } from '@/features/orders/components/deliver-order-modal';
import { OrderCard } from '@/features/orders/components/order-card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button, SearchInput, LoadingState, EmptyState } from '@/components/ui';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  PENDIENTE:  { label: 'Pendiente',    color: 'bg-amber-100 text-amber-700' },
  CONFIRMADO: { label: 'Confirmado',   color: 'bg-blue-100 text-blue-700' },
  PREPARANDO: { label: 'Preparando',   color: 'bg-indigo-100 text-indigo-700' },
  EN_RUTA:    { label: 'En Ruta',      color: 'bg-purple-100 text-purple-700' },
  ENTREGADO:  { label: 'Entregado',    color: 'bg-emerald-100 text-emerald-700' },
  CANCELADO:  { label: 'Cancelado',    color: 'bg-slate-100 text-slate-500' },
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderToAssignDriver, setOrderToAssignDriver] = useState<Order | null>(null);
  const [orderToDeliver, setOrderToDeliver] = useState<Order | null>(null);

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders-list', { search, statusFilter }],
    queryFn: () =>
      orderService.getOrders({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        limit: 50,
      }),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['orders-drivers'],
    queryFn: () => orderService.getDrivers(),
  });

  const { data: customersData } = useQuery({
    queryKey: ['orders-customers'],
    queryFn: () => customerService.getCustomers({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['orders-products'],
    queryFn: () => productService.getProducts({ limit: 100 }),
  });

  const orders = Array.isArray(ordersData?.data)
    ? ordersData.data
    : Array.isArray(ordersData)
    ? ordersData
    : [];

  const customers = Array.isArray(customersData?.data)
    ? customersData.data
    : Array.isArray(customersData)
    ? customersData
    : [];

  const products = Array.isArray(productsData?.data)
    ? productsData.data
    : Array.isArray(productsData)
    ? productsData
    : [];

  const refreshAll = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['orders-list'] });
  };

  const handleUpdateStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      await orderService.updateStatus(order.id, newStatus);
      refreshAll();
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar estado del pedido');
    }
  };

  const totalOrders = orders.length;
  const enRutaCount = orders.filter((o) => o.status === 'EN_RUTA').length;
  const pendientesCount = orders.filter(
    (o) => o.status === 'PENDIENTE' || o.status === 'CONFIRMADO',
  ).length;
  const entregadosCount = orders.filter((o) => o.status === 'ENTREGADO').length;

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Pedidos y Despacho Logístico
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de rutas, asignación de choferes y entregas a domicilio con bidones
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto"
        >
          Nuevo Pedido
        </Button>
      </div>

      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Pedidos</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{totalOrders}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">En Ruta / Despacho</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{enRutaCount}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Pendientes</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{pendientesCount}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Entregados Hoy</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{entregadosCount}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por correlativo (PED-2026-...), cliente, teléfono o dirección de entrega..."
        />

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold scrollbar-none pb-0.5">
          {[
            { label: 'Todos', value: 'ALL' },
            { label: 'Pendientes', value: 'PENDIENTE' },
            { label: 'Confirmados', value: 'CONFIRMADO' },
            { label: 'En Preparación', value: 'PREPARANDO' },
            { label: 'En Ruta', value: 'EN_RUTA' },
            { label: 'Entregados', value: 'ENTREGADO' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value as any)}
              className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                statusFilter === tab.value
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="Cargando pedidos y hoja de ruta..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-8 h-8" />}
          title="No se encontraron pedidos"
          description={
            search
              ? `No hay pedidos que coincidan con "${search}".`
              : 'No hay pedidos registrados con el estado seleccionado.'
          }
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Crear Primer Pedido
            </Button>
          }
        />
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAssignDriver={(o) => setOrderToAssignDriver(o)}
                onDeliver={(o) => setOrderToDeliver(o)}
                onUpdateStatus={(o, status) => handleUpdateStatus(o, status)}
              />
            ))}
            <div className="text-center text-xs text-slate-400 font-medium py-2">
              Mostrando {orders.length} pedidos
            </div>
          </div>

          <div className="hidden lg:flex flex-1 min-h-0 flex-col card overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider shadow-2xs">
                  <tr>
                    <th className="px-4 py-3 bg-slate-50">N° Pedido</th>
                    <th className="px-4 py-3 bg-slate-50">Cliente</th>
                    <th className="px-4 py-3 bg-slate-50">Dirección Entrega</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Estado</th>
                    <th className="px-4 py-3 bg-slate-50">Repartidor</th>
                    <th className="px-4 py-3 bg-slate-50 text-right">Total</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Fecha</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const statusInfo = (STATUS_CONFIG as Record<string, { label: string; color: string }>)[order.status] || {
                      label: order.status,
                      color: 'bg-slate-100 text-slate-600',
                    };
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[180px]">
                          <p className="font-bold text-slate-900 leading-tight">
                            {order.customer?.name ?? '—'}
                          </p>
                          <p className="text-[11px] text-slate-400">{order.customer?.phone ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <p className="truncate text-slate-700">{order.deliveryAddress}</p>
                          </div>
                          {order.deliveryReference && (
                            <p className="text-[10px] text-slate-400 pl-4 truncate">
                              Ref: {order.deliveryReference}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {order.driver ? (
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-medium text-slate-700">
                                {order.driver.firstName} {order.driver.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {(order.status === 'PENDIENTE' ||
                              order.status === 'CONFIRMADO' ||
                              order.status === 'PREPARANDO') && (
                              <button
                                onClick={() => setOrderToAssignDriver(order)}
                                title="Asignar Repartidor"
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition shadow-2xs"
                              >
                                <Truck className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {order.status === 'EN_RUTA' && (
                              <button
                                onClick={() => setOrderToDeliver(order)}
                                title="Confirmar Entrega"
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition shadow-2xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {order.status === 'PENDIENTE' && (
                              <button
                                onClick={() => handleUpdateStatus(order, 'CANCELADO')}
                                title="Cancelar Pedido"
                                className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg transition shadow-2xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Mostrando {orders.length} pedidos</span>
              <span>Hoja de Ruta Ica</span>
            </div>
          </div>
        </>
      )}

      <CreateOrderModal
        customers={customers}
        products={products}
        drivers={drivers}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refreshAll}
      />

      {orderToAssignDriver && (
        <AssignDriverModal
          order={orderToAssignDriver}
          drivers={drivers}
          isOpen={!!orderToAssignDriver}
          onClose={() => setOrderToAssignDriver(null)}
          onSuccess={refreshAll}
        />
      )}

      {orderToDeliver && (
        <DeliverOrderModal
          order={orderToDeliver}
          isOpen={!!orderToDeliver}
          onClose={() => setOrderToDeliver(null)}
          onSuccess={refreshAll}
        />
      )}
    </div>
  );
}

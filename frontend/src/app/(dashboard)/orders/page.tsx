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
  X,
  Eye,
  Send,
  User,
  RotateCcw,
} from 'lucide-react';
import { orderService } from '@/features/orders/services/order-service';
import { customerService } from '@/features/customers/services/customer-service';
import { productService } from '@/features/products/services/product-service';
import { Order, OrderStatus } from '@/features/orders/types/order';
import { CreateOrderModal } from '@/features/orders/components/create-order-modal';
import { AssignDriverModal } from '@/features/orders/components/assign-driver-modal';
import { DeliverOrderModal } from '@/features/orders/components/deliver-order-modal';
import { OrderDetailsModal } from '@/features/orders/components/order-details-modal';
import { OrderCard } from '@/features/orders/components/order-card';
import { formatCurrency, formatDate } from '@/lib/utils';
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

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'warning' | 'primary' | 'info' | 'purple' | 'success' | 'default' }> = {
  PENDIENTE:  { label: 'Pendiente',    variant: 'warning' },
  CONFIRMADO: { label: 'Confirmado',   variant: 'info' },
  PREPARANDO: { label: 'Preparando',   variant: 'primary' },
  EN_RUTA:    { label: 'En Ruta',      variant: 'purple' },
  ENTREGADO:  { label: 'Entregado',    variant: 'success' },
  CANCELADO:  { label: 'Cancelado',    variant: 'default' },
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [driverFilter, setDriverFilter] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderToAssignDriver, setOrderToAssignDriver] = useState<Order | null>(null);
  const [orderToDeliver, setOrderToDeliver] = useState<Order | null>(null);
  const [orderToViewDetails, setOrderToViewDetails] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders-list', { search, statusFilter, driverFilter }],
    queryFn: () =>
      orderService.getOrders({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        driverId: driverFilter !== 'ALL' ? driverFilter : undefined,
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

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      setIsCanceling(true);
      await orderService.updateStatus(orderToCancel.id, 'CANCELADO');
      toast.success('Pedido cancelado', `El pedido ${orderToCancel.orderNumber} fue cancelado.`);
      setOrderToCancel(null);
      refreshAll();
    } catch (err: any) {
      toast.error('Error al cancelar pedido', err?.message || 'No se pudo cancelar');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleQuickStatusChange = async (order: Order, newStatus: OrderStatus) => {
    try {
      await orderService.updateStatus(order.id, newStatus);
      const msg =
        newStatus === 'EN_RUTA'
          ? `Pedido ${order.orderNumber} despachado a ruta exitosamente.`
          : `Estado de pedido ${order.orderNumber} actualizado a ${newStatus}.`;
      toast.success('Estado actualizado', msg);
      refreshAll();
    } catch (err: any) {
      toast.error('Error al actualizar estado', err?.message || 'No se pudo actualizar el pedido');
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
      <PageHeader
        title="Pedidos y Despacho Logístico"
        description="Control de rutas, asignación de choferes y entregas a domicilio con bidones"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nuevo Pedido
          </Button>
        }
      />

      {/* Métricas de Despacho */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard
          label="Total Pedidos"
          value={totalOrders}
          subtitle="En el rango seleccionado"
          icon={<Package className="w-5 h-5" />}
          iconColor="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="En Ruta / Despacho"
          value={enRutaCount}
          subtitle="Con chofer asignado"
          icon={<Truck className="w-5 h-5" />}
          iconColor="bg-purple-50 text-purple-600"
        />

        <StatCard
          label="Pendientes"
          value={pendientesCount}
          subtitle="Por preparar o asignar"
          icon={<Clock className="w-5 h-5" />}
          iconColor="bg-amber-50 text-amber-600"
        />

        <StatCard
          label="Entregados Hoy"
          value={entregadosCount}
          subtitle="Distribución completada"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconColor="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Buscador y Filtros */}
      <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por correlativo (PED-2026-...), cliente, teléfono o dirección..."
            />
          </div>
          <div className="w-full sm:w-64 shrink-0">
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            >
              <option value="ALL">🚛 Todos los Repartidores</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

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
              : 'No hay pedidos registrados con los filtros seleccionados.'
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
          {/* Vista móvil */}
          <div className="lg:hidden space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAssignDriver={(o) => setOrderToAssignDriver(o)}
                onDeliver={(o) => setOrderToDeliver(o)}
                onViewDetails={(o) => setOrderToViewDetails(o)}
                onUpdateStatus={(o, status) => {
                  if (status === 'CANCELADO') setOrderToCancel(o);
                  else handleQuickStatusChange(o, status);
                }}
              />
            ))}
            <div className="text-center text-xs text-slate-400 font-medium py-2">
              Mostrando {orders.length} pedidos
            </div>
          </div>

          {/* Tabla Desktop */}
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
                    const statusInfo = (STATUS_CONFIG as Record<string, { label: string; variant: 'warning' | 'primary' | 'info' | 'purple' | 'success' | 'default' }>)[order.status] || {
                      label: order.status,
                      variant: 'default' as const,
                    };
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setOrderToViewDetails(order)}
                            className="font-mono font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition cursor-pointer"
                            title="Ver detalles"
                          >
                            {order.orderNumber}
                          </button>
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
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
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
                            {/* Botón Ver Detalle */}
                            <button
                              type="button"
                              onClick={() => setOrderToViewDetails(order)}
                              title="Ver Detalle Completo"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Pendiente sin chofer */}
                            {order.status === 'PENDIENTE' && !order.driver && (
                              <button
                                type="button"
                                onClick={() => setOrderToAssignDriver(order)}
                                title="Asignar Repartidor"
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition shadow-2xs flex items-center gap-1"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Asignar</span>
                              </button>
                            )}

                            {/* Confirmado / Preparando / Pendiente con chofer */}
                            {(order.status === 'CONFIRMADO' ||
                              order.status === 'PREPARANDO' ||
                              (order.status === 'PENDIENTE' && order.driver)) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(order, 'EN_RUTA')}
                                  title="Despachar a Ruta"
                                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg transition shadow-2xs flex items-center gap-1"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Despachar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOrderToAssignDriver(order)}
                                  title="Cambiar Chofer"
                                  className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition"
                                >
                                  <User className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* En Ruta */}
                            {order.status === 'EN_RUTA' && (
                              <button
                                type="button"
                                onClick={() => setOrderToDeliver(order)}
                                title="Confirmar Entrega"
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-2xs flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Entregar</span>
                              </button>
                            )}

                            {/* Cancelar si está pendiente o confirmado */}
                            {(order.status === 'PENDIENTE' || order.status === 'CONFIRMADO') && (
                              <button
                                type="button"
                                onClick={() => setOrderToCancel(order)}
                                title="Cancelar Pedido"
                                className="p-1.5 border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition"
                              >
                                <X className="w-3.5 h-3.5" />
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

      {/* Modales */}
      <OrderDetailsModal
        order={orderToViewDetails}
        isOpen={!!orderToViewDetails}
        onClose={() => setOrderToViewDetails(null)}
        onAssignDriver={(o) => setOrderToAssignDriver(o)}
        onDeliver={(o) => setOrderToDeliver(o)}
        onUpdateStatus={(o, st) => handleQuickStatusChange(o, st)}
      />
      <CreateOrderModal
        customers={customers}
        products={products}
        drivers={drivers}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          toast.success('Pedido creado', 'El nuevo pedido fue registrado.');
          refreshAll();
        }}
      />

      {orderToAssignDriver && (
        <AssignDriverModal
          order={orderToAssignDriver}
          drivers={drivers}
          isOpen={!!orderToAssignDriver}
          onClose={() => setOrderToAssignDriver(null)}
          onSuccess={() => {
            toast.success('Repartidor asignado', 'El pedido se encuentra listo para despacho.');
            refreshAll();
          }}
        />
      )}

      {orderToDeliver && (
        <DeliverOrderModal
          order={orderToDeliver}
          isOpen={!!orderToDeliver}
          onClose={() => setOrderToDeliver(null)}
          onSuccess={() => {
            toast.success('Entrega completada', 'El inventario y cobro fueron liquidados.');
            refreshAll();
          }}
        />
      )}

      {/* Confirmación para cancelar pedido */}
      <ConfirmDialog
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={handleConfirmCancelOrder}
        isLoading={isCanceling}
        title="¿Cancelar este pedido?"
        description={`¿Estás seguro de que deseas cancelar el pedido ${orderToCancel?.orderNumber} para ${orderToCancel?.customer?.name}? Esta acción no se puede deshacer.`}
        confirmText="Sí, cancelar pedido"
        variant="danger"
      />
    </div>
  );
}

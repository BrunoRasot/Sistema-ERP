'use client';

import React from 'react';
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Package,
  RotateCcw,
  User,
  ChevronRight,
  AlertCircle,
  Play,
  ArrowRight,
} from 'lucide-react';
import { Order, OrderStatus } from '../types/order';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui';

interface OrderCardProps {
  order: Order;
  onAssignDriver: (order: Order) => void;
  onUpdateStatus: (order: Order, newStatus: OrderStatus) => void;
  onDeliver: (order: Order) => void;
  onViewDetails?: (order: Order) => void;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDIENTE: {
    label: 'Pendiente',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  CONFIRMADO: {
    label: 'Confirmado',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
  },
  PREPARANDO: {
    label: 'Preparando en Almacén',
    bg: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
  },
  EN_RUTA: {
    label: 'En Ruta / Chofer Despachado',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
    dot: 'bg-purple-500 animate-pulse',
  },
  ENTREGADO: {
    label: 'Entregado con Éxito',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
  CANCELADO: {
    label: 'Cancelado',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
  },
};

export function OrderCard({
  order,
  onAssignDriver,
  onUpdateStatus,
  onDeliver,
  onViewDetails,
}: OrderCardProps) {
  const currentStatus = statusConfig[order.status] || statusConfig.PENDIENTE;

  const returnableCount =
    order.items?.reduce(
      (sum, item) => (item.product?.isReturnable ? sum + item.quantity : sum),
      0,
    ) || 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition p-4 sm:p-5 flex flex-col justify-between space-y-4">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-900">{order.orderNumber}</span>
            <span className="text-[11px] text-slate-400 font-medium">
              {formatDate(order.createdAt)}
            </span>
          </div>

          <p className="text-xs font-bold text-slate-700 mt-0.5">
            {order.customer?.name || 'Cliente sin nombre'}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-black uppercase tracking-wider ${currentStatus.bg} ${currentStatus.text}`}
        >
          <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
          <span>{currentStatus.label}</span>
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2 text-slate-600">
          <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 leading-tight">
              {order.deliveryAddress}
            </p>
            {order.deliveryReference && (
              <p className="text-[11px] text-slate-400 mt-0.5 italic">
                Ref: {order.deliveryReference}
              </p>
            )}
          </div>
        </div>

        {order.customer?.phone && (
          <div className="flex items-center gap-2 text-slate-500">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <a
              href={`tel:${order.customer.phone}`}
              className="text-brand-600 hover:underline font-semibold"
            >
              {order.customer.phone}
            </a>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            Productos ({order.items?.length || 0})
          </span>
          {returnableCount > 0 && (
            <span className="flex items-center gap-1 text-amber-700">
              <RotateCcw className="w-3 h-3" />
              {returnableCount} bidón(es)
            </span>
          )}
        </div>

        <div className="space-y-1">
          {order.items?.map((it) => (
            <div key={it.id} className="flex justify-between text-xs">
              <span className="font-medium text-slate-700 truncate pr-2">
                {it.quantity}x {it.product?.name || 'Producto'}
              </span>
              <span className="font-bold text-slate-900 shrink-0">
                {formatCurrency(it.totalPrice)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500">Total a Cobrar:</span>
          <span className="font-black text-sm text-brand-700">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Repartidor
            </span>
            <span className="font-bold text-slate-800">
              {order.driver
                ? `${order.driver.firstName} ${order.driver.lastName}`
                : 'Sin chofer asignado'}
            </span>
          </div>
        </div>

        {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
          <button
            onClick={() => onAssignDriver(order)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
          >
            {order.driver ? 'Cambiar Chofer' : 'Asignar Chofer'}
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
        {order.status === 'PENDIENTE' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onUpdateStatus(order, 'CONFIRMADO')}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            className="flex-1 bg-sky-600 hover:bg-sky-700"
          >
            Confirmar Pedido
          </Button>
        )}

        {order.status === 'CONFIRMADO' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onUpdateStatus(order, 'PREPARANDO')}
            icon={<Package className="w-3.5 h-3.5" />}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            Preparar en Almacén
          </Button>
        )}

        {order.status === 'PREPARANDO' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onUpdateStatus(order, 'EN_RUTA')}
            icon={<Truck className="w-3.5 h-3.5" />}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Despachar a Ruta
          </Button>
        )}

        {order.status === 'EN_RUTA' && (
          <Button
            size="sm"
            variant="success"
            onClick={() => onDeliver(order)}
            icon={<CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            className="flex-1 font-black shadow-md shadow-emerald-600/25"
          >
            Cobrar y Entregar
          </Button>
        )}

        {order.status === 'ENTREGADO' && (
          <div className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold text-center border border-emerald-100 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completado {order.deliveredAt ? formatDate(order.deliveredAt) : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import {
  Package,
  MapPin,
  Phone,
  Clock,
  User,
  Truck,
  CheckCircle2,
  X,
  FileText,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Order, OrderStatus } from '../types/order';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal, Button, Badge } from '@/components/ui';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignDriver?: (order: Order) => void;
  onDeliver?: (order: Order) => void;
  onUpdateStatus?: (order: Order, status: OrderStatus) => void;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: 'warning' | 'primary' | 'info' | 'purple' | 'success' | 'default' }
> = {
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  CONFIRMADO: { label: 'Confirmado', variant: 'info' },
  PREPARANDO: { label: 'En Preparación', variant: 'primary' },
  EN_RUTA: { label: 'En Ruta / Despachado', variant: 'purple' },
  ENTREGADO: { label: 'Entregado con Éxito', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'default' },
};

export function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onAssignDriver,
  onDeliver,
  onUpdateStatus,
}: OrderDetailsModalProps) {
  if (!order) return null;

  const currentStatus = statusConfig[order.status] || {
    label: order.status,
    variant: 'default' as const,
  };

  const returnableCount =
    order.items?.reduce(
      (sum, item) => (item.product?.isReturnable ? sum + item.quantity : sum),
      0,
    ) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Pedido ${order.orderNumber}`}
      description="Información de despacho, productos y estado de entrega"
      icon={<Package className="w-5 h-5 text-slate-800" />}
      iconColor="bg-slate-100"
      size="md"
    >
      <div className="space-y-4 text-xs">
        {/* Cabecera de Estado y Total */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Estado del Despacho</span>
            <div className="mt-0.5">
              <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-medium block">Importe Total</span>
            <span className="text-base font-black text-slate-900">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Datos del Cliente y Reparto */}
        <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2.5">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">{order.customer?.name || 'Público General'}</p>
              {order.customer?.documentNumber && (
                <p className="text-[11px] text-slate-500">Doc: {order.customer.documentNumber}</p>
              )}
              {order.customer?.phone && (
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {order.customer.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">{order.deliveryAddress}</p>
              {order.deliveryReference && (
                <p className="text-[11px] text-slate-500 italic">Ref: {order.deliveryReference}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Truck className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-slate-600 font-medium">
                Repartidor:{' '}
                {order.driver ? (
                  <strong className="text-slate-900">
                    {order.driver.firstName} {order.driver.lastName}
                  </strong>
                ) : (
                  <em className="text-amber-600">Sin chofer asignado</em>
                )}
              </span>
              {onAssignDriver && order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAssignDriver(order);
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
                >
                  {order.driver ? 'Reasignar' : 'Asignar Chofer'}
                </button>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-slate-600 italic">Nota: {order.notes}</p>
            </div>
          )}
        </div>

        {/* Lista de Productos del Pedido */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Productos a Despachar
            </span>
            {returnableCount > 0 && (
              <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                {returnableCount} Envases Retornables 20L
              </span>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {order.items?.map((item) => (
              <div key={item.id} className="p-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">
                    {item.product?.name || 'Producto'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <span className="font-bold text-slate-900">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones de Cambio de Estado en Footer */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
          {order.status === 'CONFIRMADO' && onUpdateStatus && (
            <Button
              variant="primary"
              size="sm"
              icon={<Truck className="w-4 h-4" />}
              onClick={() => {
                onClose();
                onUpdateStatus(order, 'EN_RUTA');
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Despachar a Ruta
            </Button>
          )}

          {order.status === 'EN_RUTA' && onDeliver && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => {
                onClose();
                onDeliver(order);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirmar Entrega
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

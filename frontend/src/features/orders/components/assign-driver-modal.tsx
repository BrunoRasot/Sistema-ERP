'use client';

import React, { useState } from 'react';
import { Truck, Check, AlertCircle } from 'lucide-react';
import { Order, Driver } from '../types/order';
import { orderService } from '../services/order-service';
import { Modal, Button, Select } from '@/components/ui';

interface AssignDriverModalProps {
  order: Order;
  drivers: Driver[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignDriverModal({
  order,
  drivers,
  isOpen,
  onClose,
  onSuccess,
}: AssignDriverModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(order.driverId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setErrorMessage('Seleccione un repartidor');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await orderService.assignDriver(order.id, selectedDriverId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al asignar chofer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Repartidor"
      description={order.orderNumber}
      icon={<Truck className="w-5 h-5" />}
      iconColor="bg-blue-50 text-blue-600"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
          <p className="font-bold text-slate-800">{order.customer?.name || 'Cliente sin nombre'}</p>
          <p className="text-slate-500 text-[11px] truncate">{order.deliveryAddress}</p>
        </div>

        <Select
          label="Repartidor Asignado"
          value={selectedDriverId}
          onChange={(e) => setSelectedDriverId(e.target.value)}
          required
        >
          <option value="">-- Seleccionar Chofer --</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.firstName} {d.lastName} {d.phone ? `(${d.phone})` : ''}
            </option>
          ))}
        </Select>

        <div className="pt-2 flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="w-1/2">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Check className="w-4 h-4" />}
            className="w-1/2"
          >
            Asignar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

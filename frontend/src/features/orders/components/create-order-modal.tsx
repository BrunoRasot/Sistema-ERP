'use client';

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Minus,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Customer } from '@/features/customers/types/customer';
import { Product } from '@/features/products/types/product';
import { Driver, CreateOrderInput } from '../types/order';
import { orderService } from '../services/order-service';
import { formatCurrency } from '@/lib/utils';
import { Modal, Button, Input, Select } from '@/components/ui';

interface CreateOrderModalProps {
  customers: Customer[];
  products: Product[];
  drivers: Driver[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItemRow {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export function CreateOrderModal({
  customers,
  products,
  drivers,
  isOpen,
  onClose,
  onSuccess,
}: CreateOrderModalProps) {
  const [customerId, setCustomerId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    if (fieldErrors.customerId) setFieldErrors((prev) => ({ ...prev, customerId: '' }));
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      if (cust.address) {
        setDeliveryAddress(cust.address);
        if (fieldErrors.deliveryAddress) setFieldErrors((prev) => ({ ...prev, deliveryAddress: '' }));
      }
      if (cust.reference) setDeliveryReference(cust.reference);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductToAdd) return;
    const prod = products.find((p) => p.id === selectedProductToAdd);
    if (!prod) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { productId: prod.id, quantity: 1, unitPrice: Number(prod.price) }];
    });
    setSelectedProductToAdd('');
    if (fieldErrors.items) setFieldErrors((prev) => ({ ...prev, items: '' }));
  };

  const updateItemQty = (prodId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.productId === prodId) {
            const next = i.quantity + delta;
            return next > 0 ? { ...i, quantity: next } : null;
          }
          return i;
        })
        .filter(Boolean) as OrderItemRow[],
    );
  };

  const removeItem = (prodId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== prodId));
  };

  const totalAmount = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!customerId) {
      errs.customerId = 'Debe seleccionar un cliente para despachar el pedido.';
    }

    if (!deliveryAddress.trim()) {
      errs.deliveryAddress = 'La dirección de entrega es obligatoria.';
    }

    if (items.length === 0) {
      errs.items = 'Debe agregar al menos un producto al pedido.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const payload: CreateOrderInput = {
      customerId,
      driverId: driverId || undefined,
      deliveryAddress: deliveryAddress.trim(),
      deliveryReference: deliveryReference.trim() || undefined,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      notes: notes.trim() || undefined,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    };

    try {
      await orderService.createOrder(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al registrar pedido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Pedido"
      description="Programación de despacho y entrega a domicilio"
      icon={<Truck className="w-5 h-5 text-slate-800" />}
      iconColor="bg-slate-100"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Cliente y Destino */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            1. Destinatario
          </h4>
          <Select
            label="Cliente Solicitante"
            value={customerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            required
            error={fieldErrors.customerId}
          >
            <option value="">-- Seleccionar cliente registrado --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.documentType}: {c.documentNumber}) · {c.phone}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Dirección de Entrega"
              type="text"
              required
              value={deliveryAddress}
              onChange={(e) => {
                setDeliveryAddress(e.target.value);
                if (fieldErrors.deliveryAddress) setFieldErrors((prev) => ({ ...prev, deliveryAddress: '' }));
              }}
              placeholder="Av./Calle, Número, Urbanización, Distrito"
              error={fieldErrors.deliveryAddress}
            />
            <Input
              label="Referencia de Entrega (Opcional)"
              type="text"
              value={deliveryReference}
              onChange={(e) => setDeliveryReference(e.target.value)}
              placeholder="Ej: Portón verde, timbre 2, frente a parque"
            />
          </div>
        </div>

        {/* 2. Logística y Despacho */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            2. Programación de Ruta
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Asignar Repartidor (Opcional)"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">Por asignar en almacén / despacho libre</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} ({d.role})
                </option>
              ))}
            </Select>
            <Input
              label="Fecha y Hora de Despacho"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
        </div>

        {/* 3. Productos del Pedido */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              3. Productos Solicitados
            </h4>
            <span className="text-[11px] font-bold text-slate-600">
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          <div className="flex gap-2">
            <Select
              value={selectedProductToAdd}
              onChange={(e) => setSelectedProductToAdd(e.target.value)}
              className="flex-1"
            >
              <option value="">-- Seleccionar producto para agregar --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.price)}) — Stock: {p.stock}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={handleAddProduct}
              disabled={!selectedProductToAdd}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-40 transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </button>
          </div>

          {fieldErrors.items && (
            <p className="text-xs text-rose-600 font-semibold">{fieldErrors.items}</p>
          )}

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="text-slate-400 py-3 text-center text-xs italic">
                Seleccione un producto arriba y presione &quot;Agregar&quot;.
              </p>
            ) : (
              items.map((row) => {
                const prod = products.find((p) => p.id === row.productId);
                return (
                  <div
                    key={row.productId}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{prod?.name || 'Producto'}</p>
                      <p className="text-slate-400 text-[11px]">
                        {formatCurrency(row.unitPrice)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemQty(row.productId, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold w-5 text-center">{row.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQty(row.productId, 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(row.productId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-1"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <span className="font-bold text-xs text-slate-600 uppercase">Total Estimado del Pedido:</span>
          <span className="text-xl font-black text-slate-900">{formatCurrency(totalAmount)}</span>
        </div>

        <Input
          label="Observaciones del Pedido"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Tocar timbre fuerte, dejar con conserje"
        />

        <div className="pt-2 flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="w-1/2">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Check className="w-4 h-4" />}
            className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isLoading ? 'Registrando...' : 'Crear Pedido'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

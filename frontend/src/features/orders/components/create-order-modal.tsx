'use client';

import React, { useState } from 'react';
import {
  X,
  Truck,
  Plus,
  Minus,
  Trash2,
  Package,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Customer } from '@/features/customers/types/customer';
import { Product } from '@/features/products/types/product';
import { Driver, CreateOrderInput } from '../types/order';
import { orderService } from '../services/order-service';
import { formatCurrency } from '@/lib/utils';

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

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Al seleccionar cliente, autocompletar su dirección habitual
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      if (cust.address) setDeliveryAddress(cust.address);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMessage('Seleccione un cliente para el pedido');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMessage('Ingrese la dirección de entrega');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Agregue al menos un producto al pedido');
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrar Nuevo Pedido</h3>
              <p className="text-xs text-slate-500">Programación de despacho y entrega a domicilio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Cliente Solicitante *</label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            >
              <option value="">-- Seleccione un cliente --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.documentType}: {c.documentNumber}) · {c.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Dirección de Entrega *
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Av./Calle, Número, Urbanización, Distrito"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Referencia de Entrega (Opcional)
              </label>
              <input
                type="text"
                value={deliveryReference}
                onChange={(e) => setDeliveryReference(e.target.value)}
                placeholder="Ej: Portón verde, timbre 2, frente a parque"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Asignar Repartidor (Opcional)
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">Por asignar en almacén</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} ({d.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Fecha / Turno Programado
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-700">Productos del Pedido *</label>
            <div className="flex gap-2">
              <select
                value={selectedProductToAdd}
                onChange={(e) => setSelectedProductToAdd(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Seleccionar producto para agregar --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.price)}) — Stock: {p.stock}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={!selectedProductToAdd}
                className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-40 transition"
              >
                Agregar
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <p className="text-slate-400 py-3 text-center italic">
                  No ha agregado productos a este pedido.
                </p>
              ) : (
                items.map((row) => {
                  const prod = products.find((p) => p.id === row.productId);
                  return (
                    <div
                      key={row.productId}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
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
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold w-4 text-center">{row.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(row.productId, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(row.productId)}
                          className="text-slate-400 hover:text-rose-500 pl-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones adicionales o notas de entrega (opcional)..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">Total Estimado</span>
              <span className="text-lg font-black text-brand-700">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || items.length === 0}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Crear Pedido</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, DollarSign, CheckCircle2, Power, AlertCircle } from 'lucide-react';
import { Category, Product, EntityStatus } from '../types/product';
import { productService } from '../services/product-service';
import { Modal, Button, Input, Select } from '@/components/ui';

interface EditProductModalProps {
  product: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductModal({
  product,
  categories,
  isOpen,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(10);
  const [status, setStatus] = useState<EntityStatus>('ACTIVE');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setCategoryId(product.categoryId || categories[0]?.id || '');
      setPrice(Number(product.price) || 0);
      setCost(Number(product.cost) || 0);
      setMinStock(Number(product.minStock) || 10);
      setStatus(product.status || 'ACTIVE');
      setError(null);
    }
  }, [product, categories]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price <= 0) {
      setError('El precio de venta debe ser mayor a 0');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await productService.updateProduct(product.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        price: Number(price),
        cost: Number(cost),
        minStock: Number(minStock),
        status,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const isInactive = status === 'INACTIVE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modificar Producto"
      description={`Código SKU: ${product.code} · ${product.name}`}
      icon={<Edit3 className="w-5 h-5" />}
      iconColor="bg-blue-50 text-blue-600"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Interruptor de Estado (Habilitado / Deshabilitado) */}
        <div
          onClick={() => setStatus(isInactive ? 'ACTIVE' : 'INACTIVE')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            isInactive
              ? 'bg-rose-50/70 border-rose-300 text-rose-900'
              : 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl text-white ${
                isInactive ? 'bg-rose-500' : 'bg-emerald-600'
              }`}
            >
              <Power className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">
                {isInactive ? 'Producto Deshabilitado' : 'Producto Activo en Catálogo'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {isInactive
                  ? 'No aparecerá disponible para ventas en el Terminal POS ni despacho'
                  : 'Disponible para ventas, facturación y control de inventario'}
              </span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              isInactive
                ? 'bg-rose-200 text-rose-800'
                : 'bg-emerald-200 text-emerald-800'
            }`}
          >
            {isInactive ? 'Inactivo' : 'Activo'}
          </span>
        </div>

        <div>
          <Input
            label="Nombre Comercial"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Recarga Bidón 20 Litros"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="Precio de Venta (S/)"
              type="number"
              step="0.01"
              min="0.1"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div>
            <Input
              label="Costo de Compra/Prod. (S/)"
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories.length > 0 && (
            <div>
              <Select
                label="Categoría"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            </div>
          )}

          <div>
            <Input
              label="Stock Mínimo (Alerta Crítica)"
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Descripción o Regla de Envase
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            placeholder="Detalles sobre el producto o condiciones del envase..."
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}

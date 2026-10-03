'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, CheckCircle2, Power, AlertCircle, Check } from 'lucide-react';
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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setCategoryId(product.categoryId || categories[0]?.id || '');
      setPrice(Number(product.price) || 0);
      setCost(Number(product.cost) || 0);
      setMinStock(Number(product.minStock) || 10);
      setStatus(product.status || 'ACTIVE');
      setFieldErrors({});
      setGeneralError(null);
    }
  }, [product, categories, isOpen]);

  if (!product) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'El nombre comercial es obligatorio.';
    } else if (name.trim().length < 3) {
      errs.name = 'Debe tener al menos 3 caracteres.';
    }

    if (isNaN(price) || price <= 0) {
      errs.price = 'El precio de venta debe ser mayor a 0.';
    }

    if (isNaN(cost) || cost < 0) {
      errs.cost = 'El costo unitario no puede ser negativo.';
    }

    if (isNaN(minStock) || minStock < 0) {
      errs.minStock = 'El stock mínimo no puede ser negativo.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError(null);

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
      setGeneralError(err?.message || 'Error al actualizar el producto');
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
      icon={<Edit3 className="w-5 h-5 text-slate-800" />}
      iconColor="bg-slate-100"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Interruptor de Estado (Habilitado / Deshabilitado) */}
        <div
          onClick={() => setStatus(isInactive ? 'ACTIVE' : 'INACTIVE')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            isInactive
              ? 'bg-rose-50/70 border-rose-300 text-rose-950'
              : 'bg-slate-900 text-white border-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isInactive ? 'bg-rose-500 text-white' : 'bg-white/20 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">
                {isInactive ? 'Producto Deshabilitado' : 'Producto Activo en Catálogo'}
              </span>
              <span className={`text-[11px] block ${isInactive ? 'text-rose-700' : 'text-slate-300'}`}>
                {isInactive
                  ? 'No disponible para ventas en POS ni pedidos'
                  : 'Habilitado para ventas, stock y facturación'}
              </span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isInactive
                ? 'bg-rose-200 text-rose-900'
                : 'bg-white text-slate-900'
            }`}
          >
            {isInactive ? 'Inactivo' : 'Activo'}
          </span>
        </div>

        <Input
          label="Nombre Comercial"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="Ej: Recarga Bidón 20 Litros"
          required
          error={fieldErrors.name}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Precio de Venta (S/)"
            type="number"
            step="0.1"
            min="0.1"
            value={price}
            onChange={(e) => {
              setPrice(parseFloat(e.target.value) || 0);
              if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
            }}
            required
            className="font-black text-slate-900"
            error={fieldErrors.price}
          />
          <Input
            label="Costo Unitario (S/)"
            type="number"
            step="0.1"
            min="0"
            value={cost}
            onChange={(e) => {
              setCost(parseFloat(e.target.value) || 0);
              if (fieldErrors.cost) setFieldErrors((prev) => ({ ...prev, cost: '' }));
            }}
            className="font-bold text-slate-700"
            error={fieldErrors.cost}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Categoría"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Input
            label="Stock Mínimo (Alerta)"
            type="number"
            min="0"
            value={minStock}
            onChange={(e) => {
              setMinStock(parseInt(e.target.value) || 0);
              if (fieldErrors.minStock) setFieldErrors((prev) => ({ ...prev, minStock: '' }));
            }}
            className="font-bold text-slate-700"
            error={fieldErrors.minStock}
          />
        </div>

        <Input
          label="Descripción Opcional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Presentación tradicional en bidón de policarbonato"
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
            {isLoading ? 'Actualizando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

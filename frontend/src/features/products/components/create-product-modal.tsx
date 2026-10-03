'use client';

import React, { useState } from 'react';
import { PackagePlus, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { Category, CreateProductInput, UnitOfMeasure } from '../types/product';
import { productService } from '../services/product-service';
import { Modal, Button, Input, Select } from '@/components/ui';

interface CreateProductModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProductModal({
  categories,
  isOpen,
  onClose,
  onSuccess,
}: CreateProductModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [unit, setUnit] = useState<UnitOfMeasure>('BIDON_20L');
  const [price, setPrice] = useState<number>(15);
  const [cost, setCost] = useState<number>(4.5);
  const [stock, setStock] = useState<number>(50);
  const [minStock, setMinStock] = useState<number>(15);
  const [isReturnable, setIsReturnable] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!code.trim()) {
      errs.code = 'El código SKU es obligatorio.';
    } else if (code.trim().length < 2) {
      errs.code = 'El código SKU debe tener al menos 2 caracteres.';
    }

    if (!name.trim()) {
      errs.name = 'El nombre comercial es obligatorio.';
    } else if (name.trim().length < 3) {
      errs.name = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (isNaN(price) || price <= 0) {
      errs.price = 'El precio de venta debe ser mayor a 0.';
    }

    if (isNaN(cost) || cost < 0) {
      errs.cost = 'El costo unitario no puede ser negativo.';
    }

    if (isNaN(stock) || stock < 0) {
      errs.stock = 'El stock inicial no puede ser negativo.';
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

    const payload: CreateProductInput = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId || categories[0]?.id,
      unit,
      price: Number(price),
      cost: Number(cost),
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 10,
      isReturnable,
    };

    try {
      await productService.createProduct(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setGeneralError(err?.message || 'Error al crear el producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Producto"
      description="Crear ítem en catálogo y registrar stock inicial"
      icon={<PackagePlus className="w-5 h-5 text-slate-800" />}
      iconColor="bg-slate-100"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Interruptor de Producto Retornable */}
        <div
          onClick={() => setIsReturnable(!isReturnable)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            isReturnable
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isReturnable ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">
                {isReturnable ? 'Producto con Envase Retornable (Canje)' : 'Producto Descartable / Sin Retorno'}
              </span>
              <span className={`text-[11px] block ${isReturnable ? 'text-slate-300' : 'text-slate-400'}`}>
                {isReturnable
                  ? 'Requiere devolución de bidón vacío por parte del cliente'
                  : 'Venta directa sin control de envases prestados'}
              </span>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isReturnable ? 'border-white bg-white text-slate-900' : 'border-slate-300'}`}>
            {isReturnable && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>

        {/* 1. Datos Básicos */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            1. Identificación y Catálogo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Código SKU"
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: '' }));
              }}
              placeholder="AGUA-20L"
              className="uppercase font-bold"
              error={fieldErrors.code}
            />
            <div className="sm:col-span-2">
              <Input
                label="Nombre Comercial"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="Ej: Recarga Bidón 20 Litros"
                error={fieldErrors.name}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Categoría"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Unidad de Medida"
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
              options={[
                { value: 'BIDON_20L', label: 'Bidón 20L' },
                { value: 'BIDON_10L', label: 'Bidón 10L' },
                { value: 'UNIDAD', label: 'Unidad' },
                { value: 'CAJA', label: 'Caja' },
                { value: 'PAQUETE', label: 'Paquete' },
                { value: 'LITRO', label: 'Litro' },
              ]}
            />
          </div>
        </div>

        {/* 2. Precios y Costos */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            2. Estructura de Precios
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Precio de Venta al Público (S/)"
              type="number"
              step="0.5"
              min="0.1"
              required
              value={price}
              onChange={(e) => {
                setPrice(parseFloat(e.target.value) || 0);
                if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
              }}
              className="font-black text-slate-900"
              error={fieldErrors.price}
            />
            <Input
              label="Costo Unitario de Producción (S/)"
              type="number"
              step="0.1"
              min="0"
              required
              value={cost}
              onChange={(e) => {
                setCost(parseFloat(e.target.value) || 0);
                if (fieldErrors.cost) setFieldErrors((prev) => ({ ...prev, cost: '' }));
              }}
              className="font-bold text-slate-700"
              error={fieldErrors.cost}
            />
          </div>
        </div>

        {/* 3. Control de Stock */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            3. Inventario
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Stock Inicial Físico"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => {
                setStock(parseInt(e.target.value) || 0);
                if (fieldErrors.stock) setFieldErrors((prev) => ({ ...prev, stock: '' }));
              }}
              className="font-bold text-slate-900"
              error={fieldErrors.stock}
            />
            <Input
              label="Stock Mínimo (Alerta de Reabastecimiento)"
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
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Agua tratada por osmosis inversa con caño vertedor"
          />
        </div>

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
            {isLoading ? 'Guardando...' : 'Guardar Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

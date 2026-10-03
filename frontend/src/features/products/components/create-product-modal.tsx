'use client';

import React, { useState } from 'react';
import { PackagePlus, Check, RotateCcw } from 'lucide-react';
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
      setError(err?.message || 'Error al crear el producto');
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
      icon={<PackagePlus className="w-5 h-5" />}
      iconColor="bg-blue-50 text-blue-600"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div
          onClick={() => setIsReturnable(!isReturnable)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            isReturnable
              ? 'bg-amber-50/70 border-amber-300 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isReturnable ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">
                {isReturnable ? 'Producto con Envase Retornable' : 'Producto Descartable'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {isReturnable
                  ? 'Requiere devolución de bidón vacío por parte del cliente'
                  : 'No involucra control de envases prestados'}
              </span>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isReturnable ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'}`}>
            {isReturnable && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Código SKU"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="AGUA-20L"
            className="uppercase font-bold"
          />
          <div className="sm:col-span-2">
            <Input
              label="Nombre Comercial"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Recarga Bidón 20 Litros"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Precio de Venta (S/)"
            type="number"
            step="0.5"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            className="font-bold"
          />
          <Input
            label="Costo Unitario (S/)"
            type="number"
            step="0.1"
            min="0"
            required
            value={cost}
            onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Stock Inicial Físico"
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 0)}
            className="font-bold text-emerald-700"
          />
          <Input
            label="Stock Mínimo (Alerta)"
            type="number"
            min="1"
            value={minStock}
            onChange={(e) => setMinStock(parseInt(e.target.value) || 1)}
            className="font-bold text-amber-700"
          />
        </div>

        <Input
          label="Descripción Opcional"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Incluye caño vertedor de repuesto"
        />

        <div className="pt-3 flex items-center gap-3">
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
            Guardar Producto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

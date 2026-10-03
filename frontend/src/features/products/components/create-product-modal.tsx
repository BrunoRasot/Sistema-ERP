'use client';

import React, { useState } from 'react';
import { PackagePlus, X, Check, Loader2, RotateCcw } from 'lucide-react';
import { Category, CreateProductInput, UnitOfMeasure } from '../types/product';
import { productService } from '../services/product-service';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Nuevo Producto</h3>
              <p className="text-xs text-slate-500 font-medium">Crear ítem en catálogo y registrar stock inicial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
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

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código SKU</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="AGUA-20L"
                className="w-full px-3 py-2 text-xs uppercase font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Recarga Bidón 20 Litros"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unidad de Medida</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="BIDON_20L">Bidón 20L</option>
                <option value="BIDON_10L">Bidón 10L</option>
                <option value="UNIDAD">Unidad</option>
                <option value="CAJA">Caja</option>
                <option value="PAQUETE">Paquete</option>
                <option value="LITRO">Litro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Precio de Venta (S/)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Costo Unitario (S/)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-bold text-slate-600 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Inicial Físico</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-bold text-emerald-700 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs font-bold text-amber-700 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descripción Opcional</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Incluye caño vertedor de repuesto"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-1/2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Producto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

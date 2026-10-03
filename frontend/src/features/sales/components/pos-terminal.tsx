'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Check,
  Loader2,
  DollarSign,
  QrCode,
  CreditCard,
  Building,
  UserCheck,
  Receipt,
  AlertCircle,
  Printer,
  ChevronDown,
  ChevronUp,
  Truck,
} from 'lucide-react';
import { Product } from '@/features/products/types/product';
import { Customer } from '@/features/customers/types/customer';
import { PaymentMethod } from '@/features/cash/types/cash';
import { CreateSaleInput, SaleType } from '../types/sale';
import { saleService } from '../services/sale-service';
import { formatCurrency } from '@/lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface PosTerminalProps {
  products: Product[];
  customers: Customer[];
  isShiftOpen: boolean;
  onSaleSuccess: () => void;
}

export function PosTerminal({
  products,
  customers,
  isShiftOpen,
  onSaleSuccess,
}: PosTerminalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [zone, setZone] = useState<string>('Zona 1 - Ica Centro');
  const [district, setDistrict] = useState<string>('Ica Cercado');
  const [subchannel, setSubchannel] = useState<string>('MOSTRADOR');
  const [showLogistics, setShowLogistics] = useState(false);
  const [bottleCondition20L, setBottleCondition20L] = useState<string>('RECARGA');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [saleType, setSaleType] = useState<SaleType>('CONTADO');
  const [operationCode, setOperationCode] = useState<string>('');
  const [bottlesReturned, setBottlesReturned] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find((cust) => cust.id === id);
    if (c) {
      if ((c as any).zone) setZone((c as any).zone);
      if ((c as any).district) setDistrict((c as any).district);
      if ((c as any).subchannel) setSubchannel((c as any).subchannel);
      else setSubchannel(c.customerType === 'EMPRESA' ? 'EMPRESA' : 'HOGAR');
    } else {
      setSubchannel('MOSTRADOR');
    }
  };


  // Agregar al carrito
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: Number(product.price) }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Cálculos de totales
  const totalAmount = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalReturnableItems = cart.reduce(
    (sum, item) => (item.product.isReturnable ? sum + item.quantity : sum),
    0,
  );

  const handleSubmitSale = async () => {
    if (cart.length === 0) {
      setErrorMessage('Seleccione al menos un producto para la venta');
      return;
    }

    if (!isShiftOpen && paymentMethod === 'EFECTIVO') {
      setErrorMessage('Debe aperturar un turno de caja para registrar cobros en efectivo');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const payload: CreateSaleInput = {
      customerId: selectedCustomerId || undefined,
      saleType,
      zone: zone.trim() || undefined,
      district: district.trim() || undefined,
      subchannel: subchannel.trim() || undefined,
      bottleCondition20L: totalReturnableItems > 0 ? bottleCondition20L : undefined,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      payment:
        saleType === 'CONTADO'
          ? {
              amount: totalAmount,
              paymentMethod,
              operationCode: operationCode.trim() || undefined,
            }
          : undefined,
      bottlesReturned: Number(bottlesReturned) || 0,
      notes: notes.trim() || undefined,
    };


    try {
      const response = await saleService.createSale(payload);
      setCompletedSale(response);
      setCart([]);
      setBottlesReturned(0);
      setOperationCode('');
      setNotes('');
      onSaleSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al procesar la venta');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintTicket = () => {
    if (!completedSale) return;
    const { sale, bottlesSummary, payment } = completedSale;
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) return;

    const itemsHtml = (sale.items || [])
      .map(
        (it: any) => `
        <tr>
          <td style="padding: 3px 0; text-align: left;">${it.quantity} x ${it.product?.name || 'Producto'}</td>
          <td style="padding: 3px 0; text-align: right;">S/ ${Number(it.totalPrice || (it.unitPrice * it.quantity)).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket ${sale.saleNumber}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            width: 72mm;
            margin: 0 auto;
            padding: 8px 4px;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px double #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="bold" style="font-size: 15px;">VIVELITE</div>
          <div>AGUA DE MESA PURIFICADA</div>
          <div>Planta de Envasado & Reparto</div>
        </div>

        <div class="divider"></div>
        <div><strong>TICKET:</strong> ${sale.saleNumber}</div>
        <div><strong>FECHA:</strong> ${new Date(sale.createdAt || Date.now()).toLocaleString('es-PE')}</div>
        <div><strong>CANAL:</strong> ${sale.subchannel || 'MOSTRADOR'}</div>
        <div><strong>CLIENTE:</strong> ${sale.customer?.name || 'PÚBLICO GENERAL'}</div>
        ${sale.customer?.documentNumber ? `<div><strong>DNI/RUC:</strong> ${sale.customer.documentNumber}</div>` : ''}
        ${sale.customer?.address ? `<div><strong>DIR:</strong> ${sale.customer.address}</div>` : ''}
        ${sale.zone || sale.district ? `<div><strong>ZONA/DIST:</strong> ${[sale.zone, sale.district].filter(Boolean).join(' - ')}</div>` : ''}

        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">DESCRIPCIÓN</th>
              <th style="text-align: right;">IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>
        <table>
          <tr>
            <td><strong>TOTAL A PAGAR:</strong></td>
            <td class="text-right bold" style="font-size: 13px;">S/ ${Number(sale.total).toFixed(2)}</td>
          </tr>
          <tr>
            <td>MÉTODO DE PAGO:</td>
            <td class="text-right">${payment?.paymentMethod || sale.saleType}</td>
          </tr>
        </table>

        ${
          bottlesSummary
            ? `
          <div class="divider"></div>
          <div class="bold text-center">CONTROL DE ENVASES</div>
          <div>Envases Llevados: ${bottlesSummary.sold}</div>
          <div>Envases Devueltos: ${bottlesSummary.returned}</div>
          ${sale.bottleCondition20L ? `<div>Condición 20L: ${sale.bottleCondition20L}</div>` : ''}
          ${bottlesSummary.newHolding !== undefined ? `<div>Saldo en poder del cliente: ${bottlesSummary.newHolding}</div>` : ''}
        `
            : ''
        }

        <div class="double-divider"></div>
        <div class="text-center" style="font-size: 11px;">
          ¡Gracias por su preferencia!<br>
          Conserve este comprobante.
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-3">
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">¡Venta Registrada!</h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                {completedSale.sale.saleNumber}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-800">{completedSale.sale.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Cobrado:</span>
                <span className="font-black text-slate-900 text-sm">
                  {formatCurrency(completedSale.sale.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Forma de Pago:</span>
                <span className="font-semibold text-brand-600">
                  {completedSale.payment?.paymentMethod || completedSale.sale.saleType}
                </span>
              </div>
              {completedSale.bottlesSummary && (
                <div className="pt-2 border-t border-slate-200 flex justify-between text-amber-800 font-semibold">
                  <span>Envases Retornados:</span>
                  <span>
                    {completedSale.bottlesSummary.returned} devueltos / {completedSale.bottlesSummary.sold} llevados
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrintTicket}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 flex-1 min-h-0">
        <div className="lg:col-span-7 flex flex-col min-h-0 space-y-2.5">
          <div className="shrink-0 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Seleccionar Productos</h2>
            <span className="text-xs text-slate-500 font-medium">{products.length} disponibles</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start">
            {products.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition relative active:scale-95 ${
                    isOutOfStock
                      ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                      : inCart
                      ? 'bg-slate-50 border-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-xs'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                      {inCart.quantity}
                    </span>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {product.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Stock: {product.stock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-0 lg:h-full overflow-hidden">
          <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              <span>Ticket de Venta</span>
            </h2>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-colors"
              >
                Vaciar
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 pr-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Cliente:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
              >
                <option value="">Público General / Mostrador</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.documentType}: {c.documentNumber})
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                  <span className="text-amber-800 font-medium">Bidones en su poder:</span>
                  <span className="font-black text-amber-900">
                    {selectedCustomer.bottlesHolding} bidones
                  </span>
                </div>
              )}
            </div>

            <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
              <div
                onClick={() => setShowLogistics(!showLogistics)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                    Logística: <span className="font-medium text-slate-500 normal-case">{zone} · {district} · {subchannel}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    Formato Oficial
                  </span>
                  {showLogistics ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {showLogistics && (
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Zona</label>
                    <input
                      type="text"
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      placeholder="Ej. Zona 1"
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Distrito</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Ej. Ica"
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Sub Canal</label>
                    <select
                      value={subchannel}
                      onChange={(e) => setSubchannel(e.target.value)}
                      className="w-full px-1.5 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="MOSTRADOR">Mostrador</option>
                      <option value="DELIVERY">Delivery</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="HOGAR">Hogar</option>
                      <option value="EMPRESA">Empresa</option>
                      <option value="BODEGA">Bodega</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              {cart.length === 0 ? (
                <div className="py-6 text-center text-slate-400 space-y-1">
                  <ShoppingCart className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-semibold">Toca los productos para agregarlos</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 transition-all hover:bg-slate-100/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatCurrency(item.unitPrice)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-500 pl-1 active:scale-95 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {(totalReturnableItems > 0 || cart.some(i => i.product.name.toLowerCase().includes('20l') || i.product.name.toLowerCase().includes('20 l'))) && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Control de Bidones 20L
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {totalReturnableItems} en ticket
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">
                      Condición 20L:
                    </label>
                    <select
                      value={bottleCondition20L}
                      onChange={(e) => setBottleCondition20L(e.target.value)}
                      className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-amber-300 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="RECARGA">Recarga (Canje)</option>
                      <option value="NUEVO_CON_ENVASE">Nuevo con Envase</option>
                      <option value="PRESTAMO">Préstamo de Bidón</option>
                      <option value="SIN_ENVASE">Sin Envase</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">
                      Vacíos devueltos:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={bottlesReturned}
                        onChange={(e) => setBottlesReturned(parseInt(e.target.value) || 0)}
                        className="w-full text-center text-xs font-bold border border-amber-300 rounded-lg py-1 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setBottlesReturned(totalReturnableItems)}
                        className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[10px] rounded-lg whitespace-nowrap"
                        title="Devuelve todos"
                      >
                        Todos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSaleType('CONTADO')}
                  className={`py-1.5 rounded-xl border transition ${
                    saleType === 'CONTADO'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Al Contado
                </button>
                <button
                  type="button"
                  onClick={() => setSaleType('CREDITO')}
                  className={`py-1.5 rounded-xl border transition ${
                    saleType === 'CREDITO'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  A Crédito
                </button>
              </div>

              {saleType === 'CONTADO' && (
                <div className="grid grid-cols-4 gap-1.5">
                  {(['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition text-center ${
                        paymentMethod === m
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {paymentMethod !== 'EFECTIVO' && saleType === 'CONTADO' && (
                <input
                  type="text"
                  value={operationCode}
                  onChange={(e) => setOperationCode(e.target.value)}
                  placeholder="Código de Operación Yape/Plin (opcional)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              )}
            </div>
          </div>

          <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-200 bg-white/95 backdrop-blur-xs space-y-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Neto):</span>
                <span>{formatCurrency(totalAmount / 1.18)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>I.G.V. (18% inc.):</span>
                <span>{formatCurrency(totalAmount - totalAmount / 1.18)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>Total a Cobrar:</span>
                <span className="text-xl text-slate-900">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitSale}
              disabled={isLoading || cart.length === 0}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Cobrar {formatCurrency(totalAmount)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

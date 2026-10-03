'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Receipt,
  Search,
  DollarSign,
  Calendar,
  CreditCard,
  User,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Eye,
  X,
  Store,
  FileSpreadsheet,
} from 'lucide-react';
import { CashShiftBanner } from '@/features/cash/components/cash-shift-banner';
import { PosTerminal } from '@/features/sales/components/pos-terminal';
import { cashService } from '@/features/cash/services/cash-service';
import { saleService } from '@/features/sales/services/sale-service';
import { productService } from '@/features/products/services/product-service';
import { customerService } from '@/features/customers/services/customer-service';
import { Sale } from '@/features/sales/types/sale';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'POS' | 'HISTORY'>('POS');
  const [searchSale, setSearchSale] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<Sale | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await saleService.exportExcel({
        search: searchSale.trim() || undefined,
        paymentStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
    } catch (err: any) {
      alert(err?.message || 'Error al exportar a Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Consultar estado de caja
  const { data: activeShift, refetch: refetchShift } = useQuery({
    queryKey: ['cash-active-shift'],
    queryFn: () => cashService.getActiveShift(),
  });

  const { data: registers = [] } = useQuery({
    queryKey: ['cash-registers'],
    queryFn: () => cashService.getRegisters(),
  });

  // Consultar productos para el POS (únicamente productos ACTIVOS)
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-pos'],
    queryFn: () => productService.getProducts({ limit: 100, status: 'ACTIVE' }),
  });

  // Consultar clientes para el POS
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers-pos'],
    queryFn: () => customerService.getCustomers({ limit: 100 }),
  });

  // Consultar ventas para el Historial
  const {
    data: salesData,
    isLoading: loadingSales,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ['sales-list', { search: searchSale, status: statusFilter }],
    queryFn: () =>
      saleService.getSales({
        search: searchSale.trim() || undefined,
        paymentStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
        limit: 50,
      }),
  });

  const products = Array.isArray(productsData?.data)
    ? productsData.data
    : Array.isArray(productsData)
    ? productsData
    : [];

  const customers = Array.isArray(customersData?.data)
    ? customersData.data
    : Array.isArray(customersData)
    ? customersData
    : [];

  const sales = Array.isArray(salesData?.data)
    ? salesData.data
    : Array.isArray(salesData)
    ? salesData
    : [];

  const handleShiftChange = () => {
    refetchShift();
    refetchSales();
  };

  const handleSaleSuccess = () => {
    refetchShift();
    refetchSales();
    queryClient.invalidateQueries({ queryKey: ['products-pos'] });
    queryClient.invalidateQueries({ queryKey: ['customers-pos'] });
  };

  const totalSalesAmount = sales.reduce((acc, s) => acc + Number(s.total || 0), 0);
  const totalPaidAmount = sales.reduce((acc, s) => acc + Number(s.paidAmount || 0), 0);
  const totalBalanceDue = sales.reduce((acc, s) => acc + Number(s.balanceDue || 0), 0);

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Ventas y Punto de Venta (POS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Emisión de tickets de venta, control de bidones retornables y arqueo de caja
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-bold border border-slate-200/80">
          <button
            onClick={() => setActiveTab('POS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'POS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Terminal POS</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'HISTORY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Historial de Ventas</span>
          </button>
        </div>
      </div>

      <div className="shrink-0">
        <CashShiftBanner
          shift={activeShift || null}
          registers={registers}
          onShiftChange={handleShiftChange}
        />
      </div>

      {activeTab === 'POS' ? (
        loadingProducts || loadingCustomers ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <span className="text-xs font-semibold">Cargando catálogo y clientes del POS...</span>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <PosTerminal
              products={products}
              customers={customers}
              isShiftOpen={!!activeShift && activeShift.status === 'ABIERTA'}
              onSaleSuccess={handleSaleSuccess}
            />
          </div>
        )
      ) : (
        /* Pestaña: Historial de Ventas */
        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="card p-3 sm:p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Total Facturado</span>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalSalesAmount)}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div className="card p-3 sm:p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Cobrado en Caja</span>
                <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(totalPaidAmount)}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div className="card p-3 sm:p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Por Cobrar (Crédito)</span>
                <p className="text-lg sm:text-xl font-bold text-rose-600 mt-0.5">
                  {formatCurrency(totalBalanceDue)}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchSale}
                onChange={(e) => setSearchSale(e.target.value)}
                placeholder="Buscar por comprobante (ej: VTA-2026-00001) o cliente..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
                {[
                  { label: 'Todas', value: 'ALL' },
                  { label: 'Pagadas', value: 'PAGADO' },
                  { label: 'Pendientes', value: 'PENDIENTE' },
                  { label: 'Parciales', value: 'PARCIAL' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                      statusFilter === filter.value
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>Exportar Excel (Formato Oficial)</span>
              </button>
            </div>
          </div>

          {loadingSales ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <span className="text-xs font-semibold">Cargando ventas registradas...</span>
            </div>
          ) : sales.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
              <Receipt className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">No se encontraron ventas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay ventas registradas con los criterios seleccionados. Realice una nueva venta desde el POS.
              </p>
              <button
                onClick={() => setActiveTab('POS')}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-brand-700"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ir al Punto de Venta</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 min-h-0 card overflow-hidden flex flex-col">
              <div className="overflow-y-auto overflow-x-auto flex-1 divide-y divide-slate-100">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-900">
                          {sale.saleNumber}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            sale.paymentStatus === 'PAGADO'
                              ? 'bg-emerald-100 text-emerald-700'
                              : sale.paymentStatus === 'PARCIAL'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {sale.saleType}
                        </span>
                        {sale.subchannel && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            {sale.subchannel}
                          </span>
                        )}
                        {(sale.zone || sale.district) && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {[sale.zone, sale.district].filter(Boolean).join(' • ')}
                          </span>
                        )}
                        {sale.bottleCondition20L && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            20L: {sale.bottleCondition20L}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 font-medium">
                        {sale.customer ? (
                          <span>
                            {sale.customer.name}{' '}
                            <span className="text-slate-400">({sale.customer.documentNumber})</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Público General</span>
                        )}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(sale.createdAt)}
                        </span>
                        {sale.items && (
                          <span>{sale.items.length} producto(s)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-medium block">Total</span>
                        <span className="text-base font-black text-slate-900">
                          {formatCurrency(sale.total)}
                        </span>
                        {sale.balanceDue > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            Debe: {formatCurrency(sale.balanceDue)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedSaleForDetail(sale)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedSaleForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Comprobante {selectedSaleForDetail.saleNumber}
                </h3>
                <span className="text-xs text-slate-400">
                  {formatDate(selectedSaleForDetail.createdAt)}
                </span>
              </div>
              <button
                onClick={() => setSelectedSaleForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <span className="text-slate-400 block text-[11px] font-semibold uppercase">Cliente & Ubicación</span>
                <p className="font-bold text-slate-800">
                  {selectedSaleForDetail.customer?.name || 'Público General'}
                </p>
                {selectedSaleForDetail.customer?.documentNumber && (
                  <p className="text-slate-500 text-[11px]">
                    {selectedSaleForDetail.customer.documentType || 'DNI'}: {selectedSaleForDetail.customer.documentNumber}
                  </p>
                )}
                {selectedSaleForDetail.customer?.phone && (
                  <p className="text-slate-500 text-[11px]">Tel: {selectedSaleForDetail.customer.phone}</p>
                )}
                {selectedSaleForDetail.customer?.address && (
                  <p className="text-slate-500 text-[11px]">Dir: {selectedSaleForDetail.customer.address}</p>
                )}
                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Zona:</span>
                    <span className="font-bold text-slate-700">{selectedSaleForDetail.zone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Distrito:</span>
                    <span className="font-bold text-slate-700">{selectedSaleForDetail.district || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sub Canal:</span>
                    <span className="font-bold text-slate-700">{selectedSaleForDetail.subchannel || '-'}</span>
                  </div>
                </div>
                {selectedSaleForDetail.bottleCondition20L && (
                  <div className="pt-1 text-[11px] text-amber-800 font-medium">
                    Condición 20L: <span className="font-bold">{selectedSaleForDetail.bottleCondition20L}</span>
                  </div>
                )}
              </div>

              {selectedSaleForDetail.items && selectedSaleForDetail.items.length > 0 && (
                <div className="space-y-1 pt-2">
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase">Ítems</span>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {selectedSaleForDetail.items.map((it) => (
                      <div key={it.id} className="p-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{it.product?.name || 'Producto'}</p>
                          <p className="text-slate-400 text-[11px]">
                            {it.quantity} x {formatCurrency(it.unitPrice)}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(it.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSaleForDetail.payments && selectedSaleForDetail.payments.length > 0 && (
                <div className="space-y-1 pt-2">
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase">
                    Pagos Registrados
                  </span>
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                    {selectedSaleForDetail.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-emerald-800">
                          {p.paymentMethod} {p.operationCode ? `(#${p.operationCode})` : ''}
                        </span>
                        <span className="font-black text-emerald-900">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedSaleForDetail.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>I.G.V. (18%):</span>
                  <span>{formatCurrency(selectedSaleForDetail.tax)}</span>
                </div>
                <div className="flex justify-between font-black text-base text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total:</span>
                  <span className="text-brand-600">{formatCurrency(selectedSaleForDetail.total)}</span>
                </div>
                {selectedSaleForDetail.balanceDue > 0 && (
                  <div className="flex justify-between font-bold text-xs text-rose-600">
                    <span>Saldo Pendiente:</span>
                    <span>{formatCurrency(selectedSaleForDetail.balanceDue)}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedSaleForDetail(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

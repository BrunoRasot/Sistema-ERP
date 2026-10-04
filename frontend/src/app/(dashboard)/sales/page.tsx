'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Receipt,
  Search,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  Store,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { CashShiftBanner } from '@/features/cash/components/cash-shift-banner';
import { PosTerminal } from '@/features/sales/components/pos-terminal';
import { cashService } from '@/features/cash/services/cash-service';
import { saleService } from '@/features/sales/services/sale-service';
import { productService } from '@/features/products/services/product-service';
import { customerService } from '@/features/customers/services/customer-service';
import { Sale } from '@/features/sales/types/sale';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PageHeader,
  StatCard,
  Badge,
  Modal,
  Button,
  SearchInput,
  LoadingState,
  EmptyState,
  useToast,
} from '@/components/ui';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
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
      toast.success('Excel exportado', 'El reporte oficial de ventas fue descargado.');
    } catch (err: any) {
      toast.error('Error al exportar', err?.message || 'No se pudo generar el archivo Excel');
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

  // Consultar productos para el POS
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
    toast.success('Venta completada', 'La transacción fue procesada exitosamente.');
  };

  const totalSalesAmount = sales.reduce((acc, s) => acc + Number(s.total || 0), 0);
  const totalPaidAmount = sales.reduce((acc, s) => acc + Number(s.paidAmount || 0), 0);
  const totalBalanceDue = sales.reduce((acc, s) => acc + Number(s.balanceDue || 0), 0);

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <PageHeader
        title="Ventas y Punto de Venta (POS)"
        description="Emisión de tickets de venta, control de bidones retornables y arqueo de caja"
        actions={
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/80">
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
        }
      />

      <div className="shrink-0">
        <CashShiftBanner
          shift={activeShift || null}
          registers={registers}
          onShiftChange={handleShiftChange}
        />
      </div>

      {activeTab === 'POS' ? (
        loadingProducts || loadingCustomers ? (
          <LoadingState text="Cargando catálogo y clientes del POS..." />
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
            <StatCard
              label="Total Facturado"
              value={formatCurrency(totalSalesAmount)}
              subtitle="Ventas registradas"
              icon={<Receipt className="w-5 h-5" />}
              iconColor="bg-blue-50 text-blue-600"
            />

            <StatCard
              label="Cobrado en Caja"
              value={formatCurrency(totalPaidAmount)}
              subtitle="Ingresos recaudados"
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconColor="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              label="Por Cobrar (Crédito)"
              value={formatCurrency(totalBalanceDue)}
              subtitle="Saldo pendiente a clientes"
              icon={<AlertTriangle className="w-5 h-5" />}
              iconColor={totalBalanceDue > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}
            />
          </div>

          <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
            <SearchInput
              value={searchSale}
              onChange={setSearchSale}
              placeholder="Buscar por comprobante (ej: VTA-2026-00001) o cliente..."
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold scrollbar-none pb-0.5">
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
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={handleExportExcel}
                disabled={isExporting}
                isLoading={isExporting}
                icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              >
                Exportar Excel (Formato Oficial)
              </Button>
            </div>
          </div>

          {loadingSales ? (
            <LoadingState text="Cargando ventas registradas..." />
          ) : sales.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-10 h-10" />}
              title="No se encontraron ventas"
              description="No hay ventas registradas con los criterios seleccionados. Realice una nueva venta desde el POS."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ShoppingCart className="w-4 h-4" />}
                  onClick={() => setActiveTab('POS')}
                >
                  Ir al Punto de Venta
                </Button>
              }
            />
          ) : (
            <div className="flex-1 min-h-0 card overflow-hidden flex flex-col">
              <div className="overflow-y-auto overflow-x-auto flex-1 divide-y divide-slate-100">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {sale.saleNumber}
                        </span>
                        <Badge
                          variant={
                            sale.paymentStatus === 'PAGADO'
                              ? 'success'
                              : sale.paymentStatus === 'PARCIAL'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {sale.paymentStatus}
                        </Badge>
                        <Badge variant="default">{sale.saleType}</Badge>
                        {sale.subchannel && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {sale.subchannel}
                          </span>
                        )}
                        {(sale.zone || sale.district) && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {[sale.zone, sale.district].filter(Boolean).join(' • ')}
                          </span>
                        )}
                        {sale.bottleCondition20L && (
                          <Badge variant="warning" size="sm">
                            20L: {sale.bottleCondition20L}
                          </Badge>
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

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
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
                        <span className="text-[11px] text-slate-400 font-medium block">Total</span>
                        <span className="text-base font-bold text-slate-900">
                          {formatCurrency(sale.total)}
                        </span>
                        {sale.balanceDue > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            Debe: {formatCurrency(sale.balanceDue)}
                          </span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="xs"
                        icon={<Eye className="w-3.5 h-3.5 text-slate-500" />}
                        onClick={() => setSelectedSaleForDetail(sale)}
                        title="Ver detalle"
                      >
                        Detalle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalle de Venta */}
      {selectedSaleForDetail && (
        <Modal
          isOpen={!!selectedSaleForDetail}
          onClose={() => setSelectedSaleForDetail(null)}
          title={`Comprobante ${selectedSaleForDetail.saleNumber}`}
          description={formatDate(selectedSaleForDetail.createdAt)}
          size="md"
        >
          <div className="text-xs space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Cliente & Ubicación
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {selectedSaleForDetail.customer?.name || 'Público General'}
              </p>
              {selectedSaleForDetail.customer?.documentNumber && (
                <p className="text-slate-500 text-xs">
                  {selectedSaleForDetail.customer.documentType || 'DNI'}: {selectedSaleForDetail.customer.documentNumber}
                </p>
              )}
              {selectedSaleForDetail.customer?.phone && (
                <p className="text-slate-500 text-xs">Teléfono: {selectedSaleForDetail.customer.phone}</p>
              )}
              {selectedSaleForDetail.customer?.address && (
                <p className="text-slate-500 text-xs">Dirección: {selectedSaleForDetail.customer.address}</p>
              )}
              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Zona:</span>
                  <span className="font-bold text-slate-700">{selectedSaleForDetail.zone || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Distrito:</span>
                  <span className="font-bold text-slate-700">{selectedSaleForDetail.district || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Subcanal:</span>
                  <span className="font-bold text-slate-700">{selectedSaleForDetail.subchannel || '-'}</span>
                </div>
              </div>
              {selectedSaleForDetail.bottleCondition20L && (
                <div className="pt-1 text-xs text-amber-800 font-medium">
                  Condición Envase 20L: <span className="font-bold">{selectedSaleForDetail.bottleCondition20L}</span>
                </div>
              )}
            </div>

            {selectedSaleForDetail.items && selectedSaleForDetail.items.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                  Productos Vendidos
                </span>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white">
                  {selectedSaleForDetail.items.map((it) => (
                    <div key={it.id} className="p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{it.product?.name || 'Producto'}</p>
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
              <div className="space-y-1.5">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                  Pagos Recibidos
                </span>
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  {selectedSaleForDetail.payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-800">
                        {p.paymentMethod} {p.operationCode ? `(#${p.operationCode})` : ''}
                      </span>
                      <span className="font-bold text-emerald-900">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedSaleForDetail.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>I.G.V. (18%):</span>
                <span>{formatCurrency(selectedSaleForDetail.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 pt-1 border-t border-slate-100">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(selectedSaleForDetail.total)}</span>
              </div>
              {selectedSaleForDetail.balanceDue > 0 && (
                <div className="flex justify-between font-bold text-xs text-rose-600">
                  <span>Saldo Pendiente:</span>
                  <span>{formatCurrency(selectedSaleForDetail.balanceDue)}</span>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              className="w-full mt-3"
              onClick={() => setSelectedSaleForDetail(null)}
            >
              Cerrar Detalle
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

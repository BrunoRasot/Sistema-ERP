'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  Receipt,
  Search,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { paymentService } from '@/features/payments/services/payment-service';
import { ReceivableSale, PaymentHistoryItem } from '@/features/payments/types/payment';
import { CollectPaymentModal } from '@/features/payments/components/collect-payment-modal';
import { ReceivableCard } from '@/features/payments/components/receivable-card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SearchInput, LoadingState, EmptyState, Button } from '@/components/ui';

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: 'Pendiente',   color: 'bg-amber-100 text-amber-700' },
  PARCIAL:   { label: 'Con Abonos',  color: 'bg-indigo-100 text-indigo-700' },
  PAGADO:    { label: 'Pagado',      color: 'bg-emerald-100 text-emerald-700' },
  ANULADO:   { label: 'Anulado',     color: 'bg-slate-100 text-slate-500' },
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'RECEIVABLES' | 'HISTORY'>('RECEIVABLES');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'OVERDUE' | 'PENDING' | 'PARTIAL'>('ALL');
  const [saleToCollect, setSaleToCollect] = useState<ReceivableSale | null>(null);

  const { data: receivablesData, isLoading: loadingReceivables, refetch: refetchReceivables } = useQuery({
    queryKey: ['receivables-list', { search, filterType }],
    queryFn: () =>
      paymentService.getReceivables({
        search: search.trim() || undefined,
        isOverdue: filterType === 'OVERDUE' ? true : undefined,
        paymentStatus:
          filterType === 'PENDING' ? 'PENDIENTE' : filterType === 'PARTIAL' ? 'PARCIAL' : undefined,
        limit: 50,
      }),
  });

  const { data: history = [], isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['payments-history'],
    queryFn: () => paymentService.getHistory(50),
    enabled: activeTab === 'HISTORY',
  });

  const receivables: ReceivableSale[] = receivablesData?.data || [];
  const metrics = receivablesData?.metrics || {
    totalPendingDebt: 0,
    overdueDebt: 0,
    debtorsCount: 0,
    collectedThisMonth: 0,
  };

  const handleCollectionSuccess = () => {
    refetchReceivables();
    refetchHistory();
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['sales-list'] });
  };

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Cuentas por Cobrar y Cobranzas</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de créditos comerciales, semáforo de morosidad y amortizaciones
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-bold border border-slate-200/80">
          <button
            onClick={() => setActiveTab('RECEIVABLES')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'RECEIVABLES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Por Cobrar ({receivables.length})</span>
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
            <span>Historial de Cobros</span>
          </button>
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Deuda Total Pendiente</span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{formatCurrency(metrics.totalPendingDebt)}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-700"><Wallet className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        </div>
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Deuda Vencida (Mora)</span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{formatCurrency(metrics.overdueDebt)}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-700"><AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        </div>
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Clientes con Deuda</span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{metrics.debtorsCount} clientes</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-700"><Users className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        </div>
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Cobrado este Mes</span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{formatCurrency(metrics.collectedThisMonth)}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-700"><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        </div>
      </div>

      {activeTab === 'RECEIVABLES' ? (
        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por cliente, DNI, RUC, celular o comprobante (VTA-...)"
            />
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold scrollbar-none pb-0.5">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  filterType === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Todas las Deudas
              </button>
              <button
                onClick={() => setFilterType('OVERDUE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  filterType === 'OVERDUE'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /><span>Vencidas / En Mora</span>
              </button>
              <button
                onClick={() => setFilterType('PENDING')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  filterType === 'PENDING'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" /><span>Sin Abonos</span>
              </button>
              <button
                onClick={() => setFilterType('PARTIAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                  filterType === 'PARTIAL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /><span>Con Abonos Parciales</span>
              </button>
            </div>
          </div>

          {loadingReceivables ? (
            <LoadingState text="Cargando cuentas por cobrar..." />
          ) : receivables.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-600" />}
              title="¡Al día! No hay cuentas pendientes"
              description={search ? `No se encontraron cuentas por cobrar para "${search}".` : 'Todos los clientes están al día con sus pagos.'}
            />
          ) : (
            <>
              <div className="lg:hidden space-y-3">
                {receivables.map((sale) => (
                  <ReceivableCard
                    key={sale.id}
                    sale={sale}
                    onCollect={(s) => setSaleToCollect(s)}
                  />
                ))}
                <div className="text-center text-xs text-slate-400 font-medium py-2">
                  {receivables.length} cuenta(s) por cobrar
                </div>
              </div>

              <div className="hidden lg:flex flex-1 min-h-0 flex-col card overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider shadow-2xs">
                      <tr>
                        <th className="px-4 py-3 bg-slate-50">Comprobante</th>
                        <th className="px-4 py-3 bg-slate-50">Cliente</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Estado</th>
                        <th className="px-4 py-3 bg-slate-50 text-right">Total Venta</th>
                        <th className="px-4 py-3 bg-slate-50 text-right">Pagado</th>
                        <th className="px-4 py-3 bg-slate-50 text-right">Saldo Pendiente</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Vencimiento</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Mora</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receivables.map((sale) => {
                        const statusInfo = PAYMENT_STATUS_CONFIG[sale.paymentStatus] ?? { label: sale.paymentStatus, color: 'bg-slate-100 text-slate-600' };
                        return (
                          <tr key={sale.id} className={`hover:bg-slate-50/70 transition-colors ${sale.isLate ? 'bg-rose-50/20' : ''}`}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                {sale.saleNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 min-w-[180px]">
                              <p className="font-bold text-slate-900 leading-tight">{sale.customer?.name || 'Cliente'}</p>
                              <p className="text-[11px] text-slate-400">{sale.customer?.phone || ''}</p>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatCurrency(sale.total)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-800 font-semibold whitespace-nowrap">
                              {formatCurrency(sale.paidAmount)}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span className="font-black text-sm text-slate-900">
                                {formatCurrency(sale.balanceDue)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-500 whitespace-nowrap">
                              {sale.dueDate ? formatDate(sale.dueDate) : '—'}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {sale.isLate ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  <AlertTriangle className="w-3 h-3 text-slate-500" />
                                  {sale.overdueDays}d
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] font-semibold">Al día</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSaleToCollect(sale)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition shadow-xs"
                              >
                                <DollarSign className="w-3 h-3" />
                                Cobrar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>{receivables.length} cuenta(s) por cobrar</span>
                  <span>Gestión de Cobranzas Ica</span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Historial de Cobros (Dual Responsive) */
        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          {loadingHistory ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">Cargando historial de cobranzas...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="card py-16 text-center border-dashed p-8 space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-400">Aún no hay abonos registrados.</p>
            </div>
          ) : (
            <>
              <div className="lg:hidden space-y-3">
                {(history as PaymentHistoryItem[]).map((item) => (
                  <div key={item.id} className="card p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-700 block">
                          {item.sale?.saleNumber ?? '—'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {item.sale?.customer?.name ?? 'Cliente'}
                        </h4>
                        {item.sale?.customer?.phone && (
                          <p className="text-[11px] text-slate-400">{item.sale.customer.phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-emerald-600 block">
                          +{formatCurrency(item.amount)}
                        </span>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          {item.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>{formatDate(item.paymentDate)}</span>
                      {item.operationCode && (
                        <span className="font-mono font-semibold text-slate-600">
                          Op: #{item.operationCode}
                        </span>
                      )}
                      {item.receivedBy && (
                        <span className="text-slate-500 font-medium">
                          Por: {item.receivedBy.firstName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-center text-xs text-slate-400 font-medium py-2">
                  {history.length} cobro(s) registrado(s)
                </div>
              </div>

              <div className="hidden lg:flex flex-1 min-h-0 flex-col card overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider shadow-2xs">
                      <tr>
                        <th className="px-4 py-3 bg-slate-50">Comprobante</th>
                        <th className="px-4 py-3 bg-slate-50">Cliente</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Método Pago</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Cód. Operación</th>
                        <th className="px-4 py-3 bg-slate-50 text-right">Monto Cobrado</th>
                        <th className="px-4 py-3 bg-slate-50 text-center">Fecha Cobro</th>
                        <th className="px-4 py-3 bg-slate-50">Cobrado Por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(history as PaymentHistoryItem[]).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                              {item.sale?.saleNumber ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 min-w-[160px]">
                            <p className="font-bold text-slate-900 leading-tight">{item.sale?.customer?.name ?? 'Cliente'}</p>
                            <p className="text-[11px] text-slate-400">{item.sale?.customer?.phone ?? ''}</p>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                              {item.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500 font-mono whitespace-nowrap">
                            {item.operationCode ? `#${item.operationCode}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-black text-emerald-600">+{formatCurrency(item.amount)}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500 whitespace-nowrap">
                            {formatDate(item.paymentDate)}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {item.receivedBy ? `${item.receivedBy.firstName} ${item.receivedBy.lastName}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>{history.length} cobro(s) registrado(s)</span>
                  <span>Historial Financiero</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {saleToCollect && (
        <CollectPaymentModal
          sale={saleToCollect}
          isOpen={!!saleToCollect}
          onClose={() => setSaleToCollect(null)}
          onSuccess={handleCollectionSuccess}
        />
      )}
    </div>
  );
}

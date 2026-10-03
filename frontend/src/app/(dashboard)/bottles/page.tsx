'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RotateCcw,
  Search,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Edit3,
  Sliders,
} from 'lucide-react';
import { configService } from '@/features/config/services/config-service';
import { customerService } from '@/features/customers/services/customer-service';
import { Customer } from '@/features/customers/types/customer';
import { BottleMovementModal } from '@/features/customers/components/bottle-movement-modal';
import { SkeletonMobileCard, SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Modal, Input, Button } from '@/components/ui';

export default function BottlesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'CLIENTS' | 'KARDEX' | 'PLANT'>('CLIENTS');
  const [search, setSearch] = useState('');
  const [selectedCustomerForBottles, setSelectedCustomerForBottles] = useState<Customer | null>(null);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [emptyStockInput, setEmptyStockInput] = useState<number>(0);
  const [fullStockInput, setFullStockInput] = useState<number>(0);
  const [thresholdInput, setThresholdInput] = useState<number>(50);

  const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['bottles-summary'],
    queryFn: () => configService.getBottleSummary(),
  });

  const { data: customersData, isLoading: isLoadingCustomers, refetch: refetchCustomers } = useQuery({
    queryKey: ['bottles-customers', { search }],
    queryFn: () =>
      customerService.getCustomers({
        search: search.trim() || undefined,
        limit: 100,
      }),
  });

  const { data: transactionsData, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['bottles-transactions', { search }],
    queryFn: () =>
      configService.getBottleTransactions({
        search: search.trim() || undefined,
        limit: 50,
      }),
  });

  const { data: stocksData, refetch: refetchStocks } = useQuery({
    queryKey: ['bottle-stocks'],
    queryFn: () => configService.getBottleStocks(),
  });

  const customers = Array.isArray(customersData?.data)
    ? customersData.data
    : Array.isArray(customersData)
    ? customersData
    : [];

  const transactions = transactionsData?.data || [];
  const plantStock = stocksData && stocksData.length > 0 ? stocksData[0] : null;

  const handleOpenPlantModal = () => {
    if (plantStock) {
      setEmptyStockInput(plantStock.totalEmpty);
      setFullStockInput(plantStock.totalFull);
      setThresholdInput(plantStock.threshold || 50);
    }
    setIsUpdatingStock(true);
  };

  const handleSavePlantStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantStock) return;
    try {
      await configService.updateBottleStock(plantStock.id, {
        totalEmpty: Number(emptyStockInput),
        totalFull: Number(fullStockInput),
        threshold: Number(thresholdInput),
      });
      setIsUpdatingStock(false);
      refetchStocks();
      refetchSummary();
      toast.success('Stock de planta actualizado', 'Los balances de bidones se recalcularon correctamente.');
    } catch (err) {
      console.error('Error al actualizar stock de bidones:', err);
      toast.error('Error al actualizar', 'No se pudo guardar los cambios en el stock.');
    }
  };

  const refreshAll = () => {
    refetchSummary();
    refetchCustomers();
    refetchTransactions();
    refetchStocks();
  };

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Control de Bidones Retornables
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitoreo en tiempo real de bidones en custodia de clientes, planta de envasado y kardex
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={refreshAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Actualizar</span>
          </button>
          <button
            onClick={handleOpenPlantModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ajustar Stock Planta</span>
          </button>
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="card p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">En Custodia (Clientes)</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <p className="text-lg sm:text-xl font-bold text-amber-600">
              {summary?.totalInCustomers ?? 0}
              <span className="text-xs font-medium text-slate-400 ml-1">bidones</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
              En {summary?.customersWithBottlesCount ?? 0} clientes activos
            </p>
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Llenos en Planta (Stock)</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <p className="text-lg sm:text-xl font-bold text-emerald-600">
              {summary?.totalFullInPlant ?? (plantStock?.totalFull || 0)}
              <span className="text-xs font-medium text-slate-400 ml-1">llenos</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Disponibles para entrega inmediata</p>
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Vacíos en Planta</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <p className="text-lg sm:text-xl font-bold text-cyan-700">
              {summary?.totalEmptyInPlant ?? (plantStock?.totalEmpty || 0)}
              <span className="text-xs font-medium text-slate-400 ml-1">vacíos</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Listos para lavado y recarga</p>
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Parque Total de Envases</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <p className="text-lg sm:text-xl font-bold text-blue-700">
              {summary?.totalBottlesInCirculation ?? 0}
              <span className="text-xs font-medium text-slate-400 ml-1">total</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Activo fijo total en circulación</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('CLIENTS')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'CLIENTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Custodia por Cliente ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('KARDEX')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'KARDEX'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Historial / Kardex de Envases</span>
        </button>
      </div>

      <div className="shrink-0 relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            activeTab === 'CLIENTS'
              ? 'Buscar cliente por nombre, DNI, RUC, teléfono o zona...'
              : 'Buscar en historial por cliente, documento o notas...'
          }
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 shadow-sm"
        />
      </div>

      {activeTab === 'CLIENTS' && (
        <>
          <div className="lg:hidden space-y-3">
            {isLoadingCustomers ? (
              <div className="space-y-2.5">
                <SkeletonMobileCard />
                <SkeletonMobileCard />
                <SkeletonMobileCard />
              </div>
            ) : customers.length === 0 ? (
              <div className="card py-16 text-center border-dashed p-8 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-400">
                  No se encontraron clientes con los filtros aplicados.
                </p>
              </div>
            ) : (
              customers.map((c) => (
                <div key={c.id} className="card p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                      {c.businessName && (
                        <p className="text-[11px] text-slate-500">{c.businessName}</p>
                      )}
                      <span className="text-[11px] font-mono text-slate-400">
                        {c.documentType}: {c.documentNumber}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.bottlesHolding > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.bottlesHolding} {c.bottlesHolding === 1 ? 'bidón' : 'bidones'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(c.zone || c.district) && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {c.zone || '-'} / {c.district || '-'}
                        </span>
                      )}
                      {c.subchannel && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                          {c.subchannel}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCustomerForBottles(c)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs transition active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Movimiento</span>
                    </button>
                  </div>
                </div>
              ))
            )}
            <div className="text-center text-xs text-slate-400 font-medium py-2">
              Mostrando {customers.length} clientes con envases
            </div>
          </div>

          <div className="hidden lg:flex flex-1 min-h-0 flex-col card overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider shadow-2xs">
                  <tr>
                    <th className="px-4 py-3 bg-slate-50">Cliente</th>
                    <th className="px-4 py-3 bg-slate-50">Documento</th>
                    <th className="px-4 py-3 bg-slate-50">Zona / Distrito</th>
                    <th className="px-4 py-3 bg-slate-50">Subcanal</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Bidones en Custodia</th>
                    <th className="px-4 py-3 bg-slate-50 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingCustomers ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 bg-slate-200/80 rounded w-36" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-slate-200/80 rounded w-24" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-slate-200/80 rounded w-28" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-slate-200/80 rounded w-20" /></td>
                        <td className="px-4 py-3 text-center"><div className="h-5 bg-slate-200/80 rounded-full w-16 mx-auto" /></td>
                        <td className="px-4 py-3 text-right"><div className="h-7 bg-slate-200/80 rounded-lg w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No se encontraron clientes con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{c.name}</span>
                          {c.businessName && (
                            <span className="text-[11px] text-slate-500">{c.businessName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {c.documentType}: {c.documentNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {c.zone || c.district ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                              {c.zone || '-'} / {c.district || '-'}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.subchannel ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700">
                              {c.subchannel}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              c.bottlesHolding > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {c.bottlesHolding} {c.bottlesHolding === 1 ? 'bidón' : 'bidones'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCustomerForBottles(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Movimiento</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Mostrando {customers.length} clientes en custodia</span>
              <span>Control de Activos Ica</span>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: Kardex / Historial Global */}
      {activeTab === 'KARDEX' && (
        <>
          <div className="lg:hidden space-y-3">
            {isLoadingTransactions ? (
              <div className="space-y-2.5">
                <SkeletonMobileCard />
                <SkeletonMobileCard />
                <SkeletonMobileCard />
              </div>
            ) : transactions.length === 0 ? (
              <div className="card py-16 text-center border-dashed p-8 space-y-2">
                <RotateCcw className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-400">
                  No hay transacciones registradas aún.
                </p>
              </div>
            ) : (
              transactions.map((tx) => {
                const isPositive = tx.type === 'ENTREGA';
                return (
                  <div key={tx.id} className="card p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'ENTREGA'
                              ? 'bg-amber-100 text-amber-800'
                              : tx.type === 'DEVOLUCION'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.type === 'PERDIDA' || tx.type === 'DANADO'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {tx.type === 'ENTREGA' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {tx.type}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">
                          {tx.customer?.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tx.customer?.documentNumber}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-base font-black ${
                            isPositive ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {isPositive ? `+${tx.quantity}` : `-${tx.quantity}`}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Saldo: {tx.balanceAfter} unid.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>
                        {new Date(tx.createdAt).toLocaleString('es-PE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                      {tx.sale ? (
                        <span className="font-mono font-semibold text-blue-600">
                          Venta: {tx.sale.saleNumber}
                        </span>
                      ) : tx.notes ? (
                        <span className="italic truncate max-w-[150px]">{tx.notes}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
            <div className="text-center text-xs text-slate-400 font-medium py-2">
              Mostrando {transactions.length} transacciones de envases
            </div>
          </div>

          {/* Vista Desktop (>= lg): Tabla Formal de Kardex de Envases con Scroll Solo en Filas */}
          <div className="hidden lg:flex flex-1 min-h-0 flex-col card overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider shadow-2xs">
                  <tr>
                    <th className="px-4 py-3 bg-slate-50">Fecha y Hora</th>
                    <th className="px-4 py-3 bg-slate-50">Operación</th>
                    <th className="px-4 py-3 bg-slate-50">Cliente</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Variación</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Saldo Resultante</th>
                    <th className="px-4 py-3 bg-slate-50">Referencia / Venta</th>
                    <th className="px-4 py-3 bg-slate-50">Registrado Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingTransactions ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 bg-slate-200/80 rounded w-28" /></td>
                        <td className="px-4 py-3"><div className="h-5 bg-slate-200/80 rounded-full w-20" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-slate-200/80 rounded w-36" /></td>
                        <td className="px-4 py-3 text-center"><div className="h-4 bg-slate-200/80 rounded w-12 mx-auto" /></td>
                        <td className="px-4 py-3 text-center"><div className="h-4 bg-slate-200/80 rounded w-16 mx-auto" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-slate-200/80 rounded w-24" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-slate-200/80 rounded w-20" /></td>
                      </tr>
                    ))
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No hay transacciones registradas aún.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isPositive = tx.type === 'ENTREGA';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleString('es-PE', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.type === 'ENTREGA'
                                  ? 'bg-amber-100 text-amber-800'
                                  : tx.type === 'DEVOLUCION'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tx.type === 'PERDIDA' || tx.type === 'DANADO'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {tx.type === 'ENTREGA' ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 min-w-[160px]">
                            <span className="font-bold text-slate-900 block">{tx.customer?.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {tx.customer?.documentNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-sm whitespace-nowrap">
                            <span className={isPositive ? 'text-amber-600' : 'text-emerald-600'}>
                              {isPositive ? `+${tx.quantity}` : `-${tx.quantity}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-black text-slate-900 text-sm whitespace-nowrap">
                            {tx.balanceAfter} unid.
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {tx.sale ? (
                              <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                Venta: {tx.sale.saleNumber}
                              </span>
                            ) : tx.notes ? (
                              <span className="text-xs text-slate-500 italic max-w-xs truncate block">{tx.notes}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {tx.recordedBy
                              ? `${tx.recordedBy.firstName} ${tx.recordedBy.lastName}`
                              : 'Sistema'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>{transactions.length} transacciones de bidones registradas</span>
              <span>Kardex Físico Ica</span>
            </div>
          </div>
        </>
      )}

      {selectedCustomerForBottles && (
        <BottleMovementModal
          customer={selectedCustomerForBottles}
          isOpen={true}
          onClose={() => setSelectedCustomerForBottles(null)}
          onSuccess={() => {
            setSelectedCustomerForBottles(null);
            refreshAll();
            toast.success('Movimiento registrado', 'El balance de bidones del cliente se actualizó correctamente');
          }}
        />
      )}

      <Modal
        isOpen={isUpdatingStock}
        onClose={() => setIsUpdatingStock(false)}
        title="Ajustar Stock de Bidones en Planta"
        description="Actualice los balances de bidones llenos y vacíos en almacén"
        icon={<Sliders className="w-5 h-5" />}
        size="md"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUpdatingStock(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="plant-stock-form"
              variant="primary"
              className="flex-1"
            >
              Guardar Cambios
            </Button>
          </div>
        }
      >
        <form id="plant-stock-form" onSubmit={handleSavePlantStock} className="space-y-4">
          <Input
            label="Bidones Llenos Disponibles (Stock listo para venta)"
            type="number"
            min="0"
            value={fullStockInput}
            onChange={(e) => setFullStockInput(Number(e.target.value))}
            required
          />

          <Input
            label="Bidones Vacíos en Planta (Para lavado y recarga)"
            type="number"
            min="0"
            value={emptyStockInput}
            onChange={(e) => setEmptyStockInput(Number(e.target.value))}
            required
          />

          <Input
            label="Umbral de Alerta Mínima de Stock"
            type="number"
            min="1"
            value={thresholdInput}
            onChange={(e) => setThresholdInput(Number(e.target.value))}
            required
          />
        </form>
      </Modal>
    </div>
  );
}

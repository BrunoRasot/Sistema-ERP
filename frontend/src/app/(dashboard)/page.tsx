'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/features/dashboard/services/dashboard-service';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  TrendingUp,
  Truck,
  RotateCcw,
  AlertTriangle,
  PlusCircle,
  Package,
  Users,
  ArrowRight,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { SkeletonKpiCard, SkeletonMobileCard } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 lg:overflow-y-auto lg:h-full lg:pr-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200/80 rounded animate-pulse" />
            <div className="h-3.5 w-64 bg-slate-200/80 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-slate-200/80 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SkeletonKpiCard />
          <SkeletonKpiCard />
          <SkeletonKpiCard />
          <SkeletonKpiCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5 space-y-3">
            <div className="h-4 w-32 bg-slate-200/80 rounded animate-pulse" />
            <div className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          </div>
          <div className="card p-5 space-y-3">
            <div className="h-4 w-32 bg-slate-200/80 rounded animate-pulse" />
            <div className="space-y-2">
              <SkeletonMobileCard />
              <SkeletonMobileCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="card p-8 text-center space-y-4 max-w-md mx-auto my-12 border-rose-100 bg-rose-50/20">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Error al cargar datos del panel</h3>
          <p className="text-xs text-slate-500 mt-1">
            No se pudo conectar con el servidor o sincronizar las métricas.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition active:scale-95 mx-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reintentar Conexión</span>
        </button>
      </div>
    );
  }

  const { metrics, weeklyChart, recentOrders, recentSales } = stats;
  const maxChartValue = Math.max(...weeklyChart.map((d: any) => d.total), 1);

  return (
    <div className="space-y-6 lg:overflow-y-auto lg:h-full lg:pr-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Panel de Control Operativo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Métricas clave del día, flujo de ventas y distribución en Ica
          </p>
        </div>

        {metrics.isShiftOpen ? (
          <Link
            href="/sales"
            className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold transition-all hover:bg-emerald-100/60 shadow-2xs self-start sm:self-auto"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block leading-tight">
                Turno Abierto
              </span>
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {metrics.cashRegisterName || 'Caja Almacén Ica'}
              </span>
            </div>
          </Link>
        ) : (
          <Link
            href="/sales"
            className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-semibold transition-all hover:bg-amber-100/60 shadow-2xs self-start sm:self-auto"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block leading-tight">
                Turno Cerrado
              </span>
              <span className="text-xs font-bold text-slate-900 leading-tight">
                Abrir caja para vender
              </span>
            </div>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Ventas Hoy</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(metrics.todaySalesTotal)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block mt-0.5">
              {metrics.todaySalesCount} ventas procesadas
            </span>
          </div>
        </div>

        <div className="card p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">En Ruta</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-bold tracking-tight text-blue-600">
              {metrics.activeOrdersCount}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block mt-0.5">
              En preparación o despacho
            </span>
          </div>
        </div>

        <div className="card p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Bidones Prestados</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-bold tracking-tight text-amber-600">
              {metrics.bottlesInHolding} unid.
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block mt-0.5">
              En posesión de clientes
            </span>
          </div>
        </div>

        <div className="card p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Por Cobrar</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-bold tracking-tight text-rose-600">
              {formatCurrency(metrics.totalPendingDebt)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block mt-0.5">
              Saldo pendiente en créditos
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ventas de los Últimos 7 Días</h2>
              <p className="text-xs text-slate-400">Ingresos consolidados por jornada</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Activo</span>
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-2">
            {weeklyChart.map((day: any, i: number) => {
              const heightPercent = Math.max(Math.round((day.total / maxChartValue) * 100), 4);
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-2 h-full justify-end group">
                  <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(day.total)}
                  </span>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg flex items-end overflow-hidden h-36">
                    <div
                      className="w-full bg-blue-600 rounded-t-lg transition-all duration-300 group-hover:bg-blue-700"
                      style={{ height: `${heightPercent}%` }}
                      title={`${day.day}: ${formatCurrency(day.total)}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Acciones Rápidas</h2>
            <p className="text-xs text-slate-400 mb-4">Atajos directos para operaciones frecuentes</p>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/sales"
                className="p-3 rounded-xl border border-blue-200/60 bg-blue-50/50 hover:bg-blue-100/60 transition-all flex flex-col items-start gap-2 group"
              >
                <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">Nueva Venta</span>
                  <span className="text-[10px] text-slate-500 block">Cobro en POS</span>
                </div>
              </Link>

              <Link
                href="/orders"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex flex-col items-start gap-2 group"
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:scale-105 transition-transform">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">Despacho</span>
                  <span className="text-[10px] text-slate-500 block">Hoja de ruta</span>
                </div>
              </Link>

              <Link
                href="/customers"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex flex-col items-start gap-2 group"
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">Clientes</span>
                  <span className="text-[10px] text-slate-500 block">Directorio Ica</span>
                </div>
              </Link>

              <Link
                href="/inventory"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex flex-col items-start gap-2 group"
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:scale-105 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">Kardex</span>
                  <span className="text-[10px] text-slate-500 block">Stock & envases</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden space-y-4">
        <div className="card overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pedidos Recientes</h2>
              <p className="text-[11px] text-slate-400">Últimos pedidos registrados</p>
            </div>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No hay pedidos recientes registrados hoy.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'DELIVERED' || order.status === 'ENTREGADO'
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.status === 'EN_RUTA'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate max-w-[200px]">
                      {order.customer?.name || 'Cliente'}
                    </p>
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ventas Recientes</h2>
              <p className="text-[11px] text-slate-400">Últimos cobros procesados</p>
            </div>
            <Link
              href="/sales"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No hay ventas recientes registradas hoy.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map((sale: any) => (
                <div key={sale.id} className="p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {sale.saleNumber}
                      </span>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {sale.saleType || 'CONTADO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate max-w-[200px]">
                      {sale.customer?.name || 'Cliente Mostrador'}
                    </p>
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0">
                    {formatCurrency(sale.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pedidos Recientes</h2>
              <p className="text-[11px] text-slate-400">Últimos despachos y repartos en Ica</p>
            </div>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">N° Pedido</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5 text-center">Estado</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No hay pedidos recientes registrados hoy.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[150px]">
                        {order.customer?.name || 'Cliente'}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.status === 'DELIVERED' || order.status === 'ENTREGADO'
                              ? 'bg-emerald-100 text-emerald-700'
                              : order.status === 'EN_RUTA'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ventas Recientes</h2>
              <p className="text-[11px] text-slate-400">Últimos cobros de agua purificada</p>
            </div>
            <Link
              href="/sales"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Comprobante</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5 text-center">Tipo</th>
                  <th className="px-4 py-2.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No hay ventas recientes registradas hoy.
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {sale.saleNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[150px]">
                        {sale.customer?.name || 'Cliente Mostrador'}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {sale.saleType || 'CONTADO'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

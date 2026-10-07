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
  DollarSign,
  Boxes,
} from 'lucide-react';
import {
  StatCard,
  PageHeader,
  Badge,
  Button,
  EmptyState,
  SkeletonKpiCard,
  SkeletonMobileCard,
} from '@/components/ui';

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
        <Button
          variant="primary"
          size="sm"
          onClick={() => refetch()}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          className="mx-auto"
        >
          Reintentar Conexión
        </Button>
      </div>
    );
  }

  const { metrics, weeklyChart, recentOrders, recentSales } = stats;
  const maxChartValue = Math.max(...weeklyChart.map((d: any) => Number(d.total) || 0), 10);
  const weeklyTotal = weeklyChart.reduce((acc: number, d: any) => acc + (Number(d.total) || 0), 0);

  // Generación de coordenadas fluidas para gráfico SVG 100% responsivo
  const chartPoints = weeklyChart.map((d: any, idx: number) => {
    const x = 20 + (idx / Math.max(weeklyChart.length - 1, 1)) * 460;
    const val = Number(d.total) || 0;
    const y = 72 - (val / maxChartValue) * 52;
    return { x, y, day: d.day, total: val };
  });

  const linePath = chartPoints.reduce((acc: string, pt: any, idx: number, arr: any[]) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[idx - 1];
    const cpX1 = prev.x + (pt.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (pt.x - prev.x) / 2;
    const cpY2 = pt.y;
    return `${acc} C ${cpX1},${cpY1} ${cpX2},${cpY2} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = chartPoints.length > 0 
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x},78 L ${chartPoints[0].x},78 Z`
    : '';

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'ENTREGADO':
      case 'DELIVERED':
        return <Badge variant="success">Entregado</Badge>;
      case 'EN_RUTA':
        return <Badge variant="purple">En Ruta</Badge>;
      case 'PREPARANDO':
        return <Badge variant="primary">Preparando</Badge>;
      case 'CONFIRMADO':
        return <Badge variant="info">Confirmado</Badge>;
      case 'CANCELADO':
        return <Badge variant="default">Cancelado</Badge>;
      default:
        return <Badge variant="warning">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:overflow-y-auto lg:h-full lg:pr-2 scrollbar-thin">
      <PageHeader
        title="Panel de Control Operativo"
        description="Métricas clave del día, flujo de ventas y distribución en Ica"
        actions={
          metrics.isShiftOpen ? (
            <Link
              href="/sales"
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold transition-all hover:bg-slate-50 shadow-2xs"
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
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold transition-all hover:bg-slate-50 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                  Turno Cerrado
                </span>
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  Abrir caja para vender
                </span>
              </div>
            </Link>
          )
        }
      />

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Ventas Hoy"
          value={formatCurrency(metrics.todaySalesTotal)}
          subtitle={`${metrics.todaySalesCount} ventas procesadas`}
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Pedidos en Ruta"
          value={metrics.activeOrdersCount}
          subtitle="En preparación o despacho"
          icon={<Truck className="w-5 h-5" />}
          iconColor="bg-purple-50 text-purple-600"
        />

        <StatCard
          label="Bidones Prestados"
          value={`${metrics.bottlesInHolding} unid.`}
          subtitle="En custodia de clientes"
          icon={<RotateCcw className="w-5 h-5" />}
          iconColor="bg-amber-50 text-amber-600"
        />

        <StatCard
          label="Por Cobrar"
          value={formatCurrency(metrics.totalPendingDebt)}
          subtitle="Saldo pendiente en créditos"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Gráfico y Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="card p-4 sm:p-5 lg:col-span-2 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ventas de los Últimos 7 Días</h2>
              <p className="text-[11px] text-slate-400">Tendencia e ingresos diarios</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200/90 px-3 py-1 rounded-xl shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Semana: {formatCurrency(weeklyTotal)}</span>
            </span>
          </div>

          {/* Gráfico SVG Fluido y Adaptable */}
          <div className="w-full pt-2">
            <div className="w-full h-24 sm:h-28 relative">
              <svg
                viewBox="0 0 500 85"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Líneas guía de fondo */}
                <line x1="15" y1="20" x2="485" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="15" y1="48" x2="485" y2="48" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="15" y1="76" x2="485" y2="76" stroke="#E2E8F0" strokeWidth="1" />

                {/* Área bajo la curva */}
                {areaPath && <path d={areaPath} fill="url(#salesGradient)" />}

                {/* Curva de línea principal */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Puntos de datos interactivos */}
                {chartPoints.map((pt: any, idx: number) => (
                  <g key={idx} className="cursor-pointer group">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.total > 0 ? 5 : 3}
                      fill={pt.total > 0 ? '#0A1A3B' : '#94A3B8'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="transition-all group-hover:r-7 group-hover:fill-blue-600"
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Etiquetas de Días de la Semana y Montos */}
            <div className="grid grid-cols-7 text-center pt-2 border-t border-slate-100 mt-1 gap-1">
              {chartPoints.map((pt: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-600">{pt.day}</span>
                  <span className={`text-[10px] font-semibold mt-0.5 ${pt.total > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                    {pt.total > 0 ? formatCurrency(pt.total) : 'S/ 0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-0.5">Acciones Rápidas</h2>
            <p className="text-[11px] text-slate-400 mb-3">Atajos directos para operaciones frecuentes</p>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/sales"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex flex-col items-start gap-2 group"
              >
                <div className="p-2 rounded-lg bg-slate-900 text-white shadow-xs group-hover:scale-105 transition-transform">
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

      {/* Listas Recientes con Scroll Interno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 pb-4">
        {/* Pedidos Recientes */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
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

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto overflow-x-hidden scrollbar-thin">
            {recentOrders.length === 0 ? (
              <EmptyState
                icon={<Truck className="w-6 h-6" />}
                title="Sin pedidos recientes"
                description="No hay pedidos registrados en la jornada."
              />
            ) : (
              recentOrders.map((order: any) => (
                <div key={order.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {order.orderNumber}
                      </span>
                      {getOrderStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate font-medium">
                      {order.customer?.name || 'Cliente'}
                    </p>
                    {order.driver && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Repartidor: {order.driver.firstName} {order.driver.lastName}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900 shrink-0">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ventas Recientes */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
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

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto overflow-x-hidden scrollbar-thin">
            {recentSales.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="w-6 h-6" />}
                title="Sin ventas recientes"
                description="No hay ventas registradas hoy."
              />
            ) : (
              recentSales.map((sale: any) => (
                <div key={sale.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {sale.saleNumber}
                      </span>
                      <Badge variant="default">{sale.saleType || 'CONTADO'}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate font-medium">
                      {sale.customer?.name || 'Cliente Mostrador'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 shrink-0">
                    {formatCurrency(sale.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

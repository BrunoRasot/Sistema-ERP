'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  RotateCcw,
  Building2,
  Home,
  AlertTriangle,
  MessageCircle,
  Trophy,
  TrendingDown,
  ShoppingBag,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { customerService } from '@/features/customers/services/customer-service';
import { Customer } from '@/features/customers/types/customer';
import { CreateCustomerModal } from '@/features/customers/components/create-customer-modal';
import { BottleMovementModal } from '@/features/customers/components/bottle-movement-modal';
import { CustomerCard } from '@/features/customers/components/customer-card';
import { formatCurrency } from '@/lib/utils';
import {
  Button,
  SearchInput,
  LoadingState,
  EmptyState,
  PageHeader,
  StatCard,
  Badge,
  useToast,
} from '@/components/ui';

const CUSTOMER_TYPE_LABELS: Record<string, { label: string; variant: 'primary' | 'purple' | 'info' | 'default' }> = {
  HOGAR: { label: 'Hogar', variant: 'primary' },
  EMPRESA: { label: 'Empresa', variant: 'purple' },
  DISTRIBUIDOR: { label: 'Distribuidor', variant: 'info' },
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<
    'ALL' | 'TOP_BUYER' | 'FREQUENT' | 'OCCASIONAL' | 'NO_PURCHASES' | 'BOTTLES' | 'HOGAR' | 'EMPRESA'
  >('ALL');
  const [sortBy, setSortBy] = useState<
    'RECENT' | 'MOST_PURCHASES' | 'LEAST_PURCHASES' | 'BOTTLES' | 'DEBT' | 'NAME'
  >('RECENT');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomerForBottles, setSelectedCustomerForBottles] = useState<Customer | null>(null);

  // Resumen estadístico de categorías de clientes
  const { data: summary } = useQuery({
    queryKey: ['customer-categories-summary'],
    queryFn: () => customerService.getCategoriesSummary(),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customers', { search, filterType, sortBy }],
    queryFn: () =>
      customerService.getCustomers({
        search: search.trim() || undefined,
        customerType: filterType === 'HOGAR' || filterType === 'EMPRESA' ? filterType : undefined,
        withBottlesPending: filterType === 'BOTTLES' ? true : undefined,
        purchaseCategory:
          filterType === 'TOP_BUYER' ||
          filterType === 'FREQUENT' ||
          filterType === 'OCCASIONAL' ||
          filterType === 'NO_PURCHASES'
            ? filterType
            : undefined,
        sortBy,
        limit: 50,
      }),
  });

  const customers: Customer[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? (data as unknown as Customer[])
    : [];

  const total = data?.meta?.total ?? customers.length;
  const totalBottlesInHolding = customers.reduce((acc, c) => acc + (c.bottlesHolding || 0), 0);
  const totalDebt = customers.reduce((acc, c) => acc + Number(c.currentDebt || 0), 0);

  return (
    <div className="space-y-4 lg:space-y-3 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <PageHeader
        title="Clientes y Envases"
        description="Control de cuentas comerciales, categorías por compra y custodia de bidones retornables"
        actions={
          <Button
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nuevo Cliente
          </Button>
        }
      />

      {/* Segmentación Comercial y Volumen de Compra */}
      <div className="shrink-0 card p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide flex items-center gap-1.5">
                Segmentación Comercial por Consumo
                <Sparkles className="w-3.5 h-3.5 text-amber-500 inline" />
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                Segmentación en tiempo real según volumen y recurrencia de pedidos en Ica
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
            <span className="text-slate-500">Facturación acumulada:</span>
            <span className="font-bold text-slate-900">{formatCurrency(summary?.totalRevenue || 0)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card 1: Top 1 */}
          <div
            onClick={() => {
              setFilterType('TOP_BUYER');
              setSortBy('MOST_PURCHASES');
            }}
            title="Clic para filtrar por clientes con mayor volumen de compra"
            className="cursor-pointer bg-white hover:bg-slate-50 transition rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-bold text-slate-900">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Mayor Compra (Top)
              </span>
              <Badge variant="warning">{summary?.topBuyersCount || 0} TOP</Badge>
            </div>
            {summary?.topBuyer ? (
              <div>
                <p className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition">
                  {summary.topBuyer.name}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span className="font-bold text-slate-900 text-xs">
                    {formatCurrency(summary.topBuyer.totalPurchases)}
                  </span>
                  <span>
                    {summary.topBuyer.salesCount} {summary.topBuyer.salesCount === 1 ? 'pedido' : 'pedidos'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Sin compras registradas</p>
            )}
            <span className="text-[10px] text-slate-400 group-hover:text-blue-600 block pt-0.5 font-medium transition">
              Filtrar mejores clientes →
            </span>
          </div>

          {/* Card 2: Menor Compra */}
          <div
            onClick={() => {
              setFilterType('OCCASIONAL');
              setSortBy('LEAST_PURCHASES');
            }}
            title="Clic para filtrar clientes con menor compra acumulada"
            className="cursor-pointer bg-white hover:bg-slate-50 transition rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-bold text-slate-900">
                <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                Menor Compra
              </span>
              <Badge variant="default">{summary?.occasionalCount || 0} Menores</Badge>
            </div>
            {summary?.leastBuyer ? (
              <div>
                <p className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition">
                  {summary.leastBuyer.name}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span className="font-bold text-slate-900 text-xs">
                    {formatCurrency(summary.leastBuyer.totalPurchases)}
                  </span>
                  <span>
                    {summary.leastBuyer.salesCount} {summary.leastBuyer.salesCount === 1 ? 'compra' : 'compras'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Sin clientes con compras mínimas</p>
            )}
            <span className="text-[10px] text-slate-400 group-hover:text-blue-600 block pt-0.5 font-medium transition">
              Oportunidad de reactivación →
            </span>
          </div>

          {/* Card 3: Clientes Frecuentes */}
          <div
            onClick={() => {
              setFilterType('FREQUENT');
              setSortBy('MOST_PURCHASES');
            }}
            title="Clic para ver clientes habituales"
            className="cursor-pointer bg-white hover:bg-slate-50 transition rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-bold text-slate-900">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                Clientes Frecuentes
              </span>
              <Badge variant="success">{summary?.frequentCount || 0} Clientes</Badge>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              Clientes con consumo regular y recurrente en Ica.
            </p>
            <span className="text-[10px] text-slate-400 group-hover:text-blue-600 block pt-0.5 font-medium transition">
              Ver clientes regulares →
            </span>
          </div>

          {/* Card 4: Sin Compras */}
          <div
            onClick={() => {
              setFilterType('NO_PURCHASES');
              setSortBy('RECENT');
            }}
            title="Clic para ver clientes registrados sin compras"
            className="cursor-pointer bg-white hover:bg-slate-50 transition rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-bold text-slate-900">
                <Users className="w-3.5 h-3.5 text-slate-600" />
                Sin Compras Aún
              </span>
              <Badge variant="default">{summary?.noPurchasesCount || 0} Nuevos</Badge>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              Cuentas registradas pendientes de su primera orden.
            </p>
            <span className="text-[10px] text-slate-400 group-hover:text-blue-600 block pt-0.5 font-medium transition">
              Ver para activar ventas →
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Generales */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Clientes Totales"
          value={total}
          subtitle="Directorio activo en Ica"
          icon={<Users className="w-5 h-5" />}
          iconColor="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Bidones en Custodia"
          value={`${totalBottlesInHolding} unid.`}
          subtitle="En posesión de clientes"
          icon={<RotateCcw className="w-5 h-5" />}
          iconColor="bg-amber-50 text-amber-600"
        />

        <StatCard
          label="Deuda por Cobrar"
          value={formatCurrency(totalDebt)}
          subtitle="Saldo pendiente en cartera"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor={totalDebt > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}
        />
      </div>

      {/* Buscador y Filtros */}
      <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por DNI, RUC, Nombre, Celular o Dirección en Ica..."
        />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold flex-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos ({total})
            </button>

            <button
              onClick={() => {
                setFilterType('TOP_BUYER');
                setSortBy('MOST_PURCHASES');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                filterType === 'TOP_BUYER'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Mayor Compra (Top)</span>
            </button>

            <button
              onClick={() => {
                setFilterType('FREQUENT');
                setSortBy('MOST_PURCHASES');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                filterType === 'FREQUENT'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
              <span>Frecuentes</span>
            </button>

            <button
              onClick={() => {
                setFilterType('OCCASIONAL');
                setSortBy('LEAST_PURCHASES');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                filterType === 'OCCASIONAL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Menor Compra</span>
            </button>

            <button
              onClick={() => {
                setFilterType('NO_PURCHASES');
                setSortBy('RECENT');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                filterType === 'NO_PURCHASES'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span>Sin Compras</span>
            </button>

            <button
              onClick={() => setFilterType('BOTTLES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                filterType === 'BOTTLES'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Con Bidones Prestados</span>
            </button>

            <button
              onClick={() => setFilterType('HOGAR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                filterType === 'HOGAR'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-slate-600" />
              <span>Hogares</span>
            </button>

            <button
              onClick={() => setFilterType('EMPRESA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                filterType === 'EMPRESA'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Empresas</span>
            </button>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold whitespace-nowrap flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              Ordenar:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="MOST_PURCHASES">⬇️ Mayor Compra (S/)</option>
              <option value="LEAST_PURCHASES">⬆️ Menor Compra (S/)</option>
              <option value="RECENT">🕒 Más Recientes</option>
              <option value="BOTTLES">💧 Más Bidones</option>
              <option value="DEBT">⚠️ Mayor Deuda</option>
              <option value="NAME">🔤 Nombre (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="Cargando directorio de clientes..." />
      ) : isError ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-600">Error al consultar los clientes desde el servidor.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No se encontraron clientes"
          description={search ? `No hay resultados para "${search}".` : 'Aún no hay clientes registrados con este filtro.'}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Registrar Primer Cliente
            </Button>
          }
        />
      ) : (
        <>
          {/* Vista móvil */}
          <div className="lg:hidden space-y-3">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onOpenBottleModal={(c) => setSelectedCustomerForBottles(c)}
              />
            ))}
            <p className="text-center text-xs text-slate-400 pt-2 pb-1 font-medium">
              {customers.length} de {total} clientes registrados
            </p>
          </div>

          {/* Tabla desktop */}
          <div className="hidden lg:flex flex-1 min-h-0 flex-col card overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider shadow-2xs">
                  <tr>
                    <th className="px-4 py-3 bg-slate-50">Cliente</th>
                    <th className="px-4 py-3 bg-slate-50">Documento</th>
                    <th className="px-4 py-3 bg-slate-50">Contacto</th>
                    <th className="px-4 py-3 bg-slate-50">Ubicación (Ica)</th>
                    <th className="px-4 py-3 bg-slate-50">Canal / Segmento</th>
                    <th className="px-4 py-3 bg-slate-50 text-right">Volumen Compra / Categoría</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Bidones Custodia</th>
                    <th className="px-4 py-3 bg-slate-50 text-right">Saldo Deuda</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const typeInfo = CUSTOMER_TYPE_LABELS[c.customerType] || {
                      label: c.customerType,
                      variant: 'default' as const,
                    };
                    const cleanPhone = (c.phone || '').replace(/\D/g, '');

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 min-w-[180px]">
                          <p className="font-bold text-slate-900 text-xs">{c.name}</p>
                          {c.businessName && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{c.businessName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {c.documentType}: {c.documentNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.phone ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700">{c.phone}</span>
                              <a
                                href={`https://wa.me/51${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Enviar WhatsApp"
                                className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="truncate text-slate-700">{c.address || '—'}</p>
                          {(c.zone || c.district) && (
                            <p className="text-[10px] text-slate-400 font-medium truncate">
                              {[c.zone, c.district].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={typeInfo.variant}>
                            {typeInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-bold text-slate-900 text-xs">
                              {formatCurrency(c.totalPurchases || 0)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.salesCount || 0} {c.salesCount === 1 ? 'pedido' : 'pedidos'}
                            </span>
                            <div>
                              {c.purchaseCategory === 'TOP_BUYER' && (
                                <Badge variant="warning" size="sm">
                                  🌟 Mayor Compra
                                </Badge>
                              )}
                              {c.purchaseCategory === 'FREQUENT' && (
                                <Badge variant="success" size="sm">
                                  🛒 Frecuente
                                </Badge>
                              )}
                              {c.purchaseCategory === 'OCCASIONAL' && (
                                <Badge variant="default" size="sm">
                                  📉 Menor Compra
                                </Badge>
                              )}
                              {(!c.purchaseCategory || c.purchaseCategory === 'NO_PURCHASES') && (
                                <Badge variant="default" size="sm">
                                  🆕 Sin Compras
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <Badge variant={c.bottlesHolding > 0 ? 'warning' : 'default'}>
                            {c.bottlesHolding} {c.bottlesHolding === 1 ? 'bidón' : 'bidones'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={`font-bold text-xs ${
                              Number(c.currentDebt || 0) > 0 ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {formatCurrency(Number(c.currentDebt || 0))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="xs"
                            icon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
                            onClick={() => setSelectedCustomerForBottles(c)}
                            title="Registrar devolución o entrega de bidones"
                          >
                            Envases
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Mostrando {customers.length} de {total} clientes</span>
              <span>Distribución Ica</span>
            </div>
          </div>
        </>
      )}

      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          toast.success('Cliente registrado', 'El nuevo cliente fue añadido a la cartera comercial.');
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          queryClient.invalidateQueries({ queryKey: ['customer-categories-summary'] });
        }}
      />

      {selectedCustomerForBottles && (
        <BottleMovementModal
          customer={selectedCustomerForBottles}
          isOpen={!!selectedCustomerForBottles}
          onClose={() => setSelectedCustomerForBottles(null)}
          onSuccess={() => {
            toast.success('Movimiento de envases registrado', 'El saldo de bidones en custodia fue actualizado.');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer-categories-summary'] });
          }}
        />
      )}
    </div>
  );
}

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
} from 'lucide-react';
import { customerService } from '@/features/customers/services/customer-service';
import { Customer } from '@/features/customers/types/customer';
import { CreateCustomerModal } from '@/features/customers/components/create-customer-modal';
import { BottleMovementModal } from '@/features/customers/components/bottle-movement-modal';
import { CustomerCard } from '@/features/customers/components/customer-card';
import { formatCurrency } from '@/lib/utils';
import { Button, SearchInput, LoadingState, EmptyState } from '@/components/ui';

const CUSTOMER_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  HOGAR: { label: 'Hogar', color: 'bg-blue-50 text-blue-700' },
  EMPRESA: { label: 'Empresa', color: 'bg-indigo-50 text-indigo-700' },
  DISTRIBUIDOR: { label: 'Distribuidor', color: 'bg-purple-50 text-purple-700' },
};

const LOYALTY_LABELS: Record<string, { label: string; color: string }> = {
  BRONCE: { label: 'Bronce', color: 'text-amber-700' },
  PLATA: { label: 'Plata', color: 'text-slate-500' },
  ORO: { label: 'Oro', color: 'text-yellow-600' },
  DIAMANTE: { label: 'Diamante', color: 'text-cyan-600' },
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BOTTLES' | 'HOGAR' | 'EMPRESA'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomerForBottles, setSelectedCustomerForBottles] = useState<Customer | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customers', { search, filterType }],
    queryFn: () =>
      customerService.getCustomers({
        search: search.trim() || undefined,
        customerType: filterType === 'HOGAR' || filterType === 'EMPRESA' ? filterType : undefined,
        withBottlesPending: filterType === 'BOTTLES' ? true : undefined,
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
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Clientes y Envases
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de cuentas comerciales, saldos y custodia de bidones retornables
          </p>
        </div>

        <Button
          variant="primary"
          icon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto"
        >
          Nuevo Cliente
        </Button>
      </div>

      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Clientes Totales</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{total}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Bidones en Custodia</span>
            <p className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5">{totalBottlesInHolding} unid.</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="card p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Deuda por Cobrar</span>
            <p className="text-lg sm:text-xl font-bold text-rose-600 mt-0.5">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      <div className="shrink-0 card p-3 sm:p-3.5 space-y-2.5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por DNI, RUC, Nombre, Celular o Dirección en Ica..."
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
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
            onClick={() => setFilterType('BOTTLES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'BOTTLES'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Con Bidones Prestados</span>
          </button>

          <button
            onClick={() => setFilterType('HOGAR')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'HOGAR'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Hogares</span>
          </button>

          <button
            onClick={() => setFilterType('EMPRESA')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
              filterType === 'EMPRESA'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Empresas</span>
          </button>
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
                    <th className="px-4 py-3 bg-slate-50 text-center">Bidones Custodia</th>
                    <th className="px-4 py-3 bg-slate-50 text-right">Saldo Deuda</th>
                    <th className="px-4 py-3 bg-slate-50 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const typeInfo = CUSTOMER_TYPE_LABELS[c.customerType] || {
                      label: c.customerType,
                      color: 'bg-slate-100 text-slate-600',
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
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              c.bottlesHolding > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {c.bottlesHolding} {c.bottlesHolding === 1 ? 'bidón' : 'bidones'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={`font-black text-xs ${
                              Number(c.currentDebt || 0) > 0 ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {formatCurrency(Number(c.currentDebt || 0))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCustomerForBottles(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                            title="Registrar devolución o entrega de bidones"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Envases</span>
                          </button>
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
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
      />

      {selectedCustomerForBottles && (
        <BottleMovementModal
          customer={selectedCustomerForBottles}
          isOpen={!!selectedCustomerForBottles}
          onClose={() => setSelectedCustomerForBottles(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
        />
      )}
    </div>
  );
}

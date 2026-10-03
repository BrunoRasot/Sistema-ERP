'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Droplets, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cashService } from '@/features/cash/services/cash-service';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Panel de Control Operativo', subtitle: 'Métricas en tiempo real y distribución' },
  '/sales': { title: 'Punto de Venta & Caja', subtitle: 'Emisión de comprobantes y flujo de caja' },
  '/orders': { title: 'Pedidos y Repartos', subtitle: 'Despacho, rutas y entregas a domicilio' },
  '/bottles': { title: 'Control de Envases & Bidones', subtitle: 'Custodia por cliente y balance de planta' },
  '/customers': { title: 'Directorio de Clientes', subtitle: 'Cartera, créditos y saldo de bidones en Ica' },
  '/products': { title: 'Catálogo de Productos', subtitle: 'Precios, stock crítico y control de inventario' },
  '/inventory': { title: 'Inventario y Kardex', subtitle: 'Movimientos físicos, producción y mermas' },
  '/payments': { title: 'Cuentas por Cobrar & Pagos', subtitle: 'Cobranza de créditos y registro de abonos' },
  '/billing': { title: 'Facturación Electrónica (SUNAT)', subtitle: 'Boletas B001, Facturas F001 y tickets' },
  '/imports': { title: 'Importación de Datos Excel', subtitle: 'Carga masiva oficial de clientes y ventas' },
  '/settings': { title: 'Configuración del Sistema', subtitle: 'Parámetros, sucursales y permisos de usuario' },
};

interface HeaderProps {
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ collapsed = false, onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const pageInfo = PAGE_TITLES[pathname] || { title: 'Vivelite', subtitle: 'Distribución Ica' };

  const { data: activeShift } = useQuery({
    queryKey: ['cash-active-shift'],
    queryFn: () => cashService.getActiveShift(),
  });

  const isShiftOpen = activeShift && activeShift.status === 'ABIERTA';

  return (
    <header
      className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 w-full"
    >
      <div className="flex items-center gap-3 min-w-0">

        <div className="lg:hidden flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xs shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight block truncate leading-tight">
              {pageInfo.title}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block truncate leading-tight">
              Vivelite · Ica
            </span>
          </div>
        </div>

        <div className="hidden lg:block min-w-0">
          <h1 className="font-bold text-sm text-slate-900 tracking-tight truncate leading-tight">
            {pageInfo.title}
          </h1>
          <p className="text-[11px] text-slate-400 truncate leading-tight">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/sales"
          title={isShiftOpen ? 'Caja abierta - Clic para ver arqueo' : 'Caja cerrada - Clic para abrir turno'}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shadow-2xs transition-all hover:scale-105',
            isShiftOpen
              ? 'bg-emerald-50 border-emerald-200/70 text-emerald-700 hover:bg-emerald-100/60'
              : 'bg-amber-50 border-amber-200/70 text-amber-700 hover:bg-amber-100/60',
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isShiftOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500',
            )}
          />
          <span>{isShiftOpen ? 'Caja Abierta' : 'Caja Cerrada'}</span>
        </Link>

        <button
          title="Notificaciones"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}

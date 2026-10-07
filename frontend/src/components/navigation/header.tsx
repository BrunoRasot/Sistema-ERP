'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
  '/billing': { title: 'Comprobantes de Venta', subtitle: 'Registro de tickets emitidos y control de ventas' },
  '/imports': { title: 'Importación de Datos Excel', subtitle: 'Carga masiva oficial de clientes y ventas' },
  '/settings': { title: 'Configuración del Sistema', subtitle: 'Parámetros, sucursales y permisos de usuario' },
};

interface HeaderProps {
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ collapsed = false, onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const pageInfo = PAGE_TITLES[pathname] || { title: 'ARCA Corporation', subtitle: 'Distribución Ica' };

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
          <div className="h-8 px-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
            <img src="/logo.png" alt="ARCA Corporation" className="h-5 w-auto object-contain" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight block truncate leading-tight">
              {pageInfo.title}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block truncate leading-tight">
              ARCA Corporation
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-400">ARCA ERP</span>
          <span className="text-slate-300 text-xs">/</span>
          <span className="text-xs font-bold text-slate-800 tracking-tight truncate">
            {pageInfo.title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/sales"
          title={isShiftOpen ? 'Caja abierta - Clic para ver arqueo' : 'Caja cerrada - Clic para abrir turno'}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-[11px] font-bold shadow-2xs transition-all hover:scale-105',
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
      </div>
    </header>
  );
}

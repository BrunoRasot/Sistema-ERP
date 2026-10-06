'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Droplets } from 'lucide-react';
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

      <div className="flex items-center gap-2.5 shrink-0">
        <div 
          title="Este es un entorno de demostración. Todos los datos mostrados son ficticios y las operaciones realizadas no representan transacciones reales."
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold select-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span className="font-bold text-amber-900">MODO DEMO</span>
          <span className="text-amber-700 font-normal truncate max-w-[280px]">· Datos ficticios de prueba</span>
        </div>

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

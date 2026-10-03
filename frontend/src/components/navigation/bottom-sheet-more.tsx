'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Truck,
  RotateCcw,
  Wallet,
  Receipt,
  FileSpreadsheet,
  Settings,
  LogOut,
  X,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetMoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BottomSheetMore({ isOpen, onClose }: BottomSheetMoreProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vivelite_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vivelite_access_token');
    localStorage.removeItem('vivelite_refresh_token');
    localStorage.removeItem('vivelite_user');
    window.location.href = '/login';
  };

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'AD';

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrador',
    VENDEDOR: 'Vendedor',
    REPARTIDOR: 'Repartidor',
  };

  const secondaryModules = [
    {
      name: 'Pedidos y Reparto',
      description: 'Despacho, rutas y choferes',
      href: '/orders',
      icon: Truck,
      color: 'text-purple-600 bg-purple-50 border-purple-200/60',
    },
    {
      name: 'Control de Bidones',
      description: 'Envases llenos, vacíos y en custodia',
      href: '/bottles',
      icon: RotateCcw,
      color: 'text-amber-600 bg-amber-50 border-amber-200/60',
    },
    {
      name: 'Cuentas por Cobrar',
      description: 'Créditos, cobranzas y mora',
      href: '/payments',
      icon: Wallet,
      color: 'text-rose-600 bg-rose-50 border-rose-200/60',
    },
    {
      name: 'Catálogo de Productos',
      description: 'Precios, SKUs y presentaciones',
      href: '/products',
      icon: Package,
      color: 'text-blue-600 bg-blue-50 border-blue-200/60',
    },
    {
      name: 'Facturación SUNAT',
      description: 'Boletas, facturas y comprobantes',
      href: '/billing',
      icon: Receipt,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
    },
    {
      name: 'Importar Excel',
      description: 'Carga masiva de datos y clientes',
      href: '/imports',
      icon: FileSpreadsheet,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
    },
    {
      name: 'Configuración',
      description: 'Zonas de Ica, distritos y parámetros',
      href: '/settings',
      icon: Settings,
      color: 'text-slate-700 bg-slate-100 border-slate-200/60',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-slate-200/80 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-250">
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Administrador Ica' : 'Administrador Ica'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-500 font-medium">
                  {user?.role ? roleLabel[user.role] ?? user.role : 'Super Admin'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Sede Ica
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
            Módulos del Sistema
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {secondaryModules.map((mod) => {
              const isActive = pathname.startsWith(mod.href);
              const Icon = mod.icon;

              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98]',
                    isActive
                      ? 'bg-blue-50/70 border-blue-300 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800',
                  )}
                >
                  <div className={cn('p-2.5 rounded-xl border shrink-0', mod.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate leading-tight">{mod.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{mod.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-rose-200 bg-rose-50/70 text-rose-700 text-xs font-bold transition-all active:scale-[0.98] hover:bg-rose-100"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

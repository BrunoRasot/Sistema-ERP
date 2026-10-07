'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  RotateCcw,
  Users,
  Package,
  Boxes,
  Wallet,
  Receipt,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; role?: string } | null>(null);

  // Estados desplegables de secciones (acordeón como en el diseño de referencia)
  const [openCategories, setOpenCategories] = useState(true);
  const [openManagement, setOpenManagement] = useState(true);

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

  // Menú principal
  const primaryItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Ventas y Caja', href: '/sales', icon: ShoppingCart },
    { name: 'Pedidos y Reparto', href: '/orders', icon: Truck },
    { name: 'Control de Bidones', href: '/bottles', icon: RotateCcw },
    { name: 'Clientes', href: '/customers', icon: Users },
  ];

  // Categorías operativas con accesos directos
  const operationalCategories = [
    { name: 'En Ruta / Despacho', href: '/orders?status=EN_RUTA', dotColor: '#10B981' },
    { name: 'Cuentas por Cobrar', href: '/payments', dotColor: '#F59E0B' },
    { name: 'Stock Crítico', href: '/products?filter=LOW_STOCK', dotColor: '#EF4444' },
    { name: 'Bidones en Custodia', href: '/bottles', dotColor: '#06B6D4' },
  ];

  // Gestión & Sistema
  const managementItems = [
    { name: 'Productos y Catálogo', href: '/products', icon: Package },
    { name: 'Inventario (Kardex)', href: '/inventory', icon: Boxes },
    { name: 'Facturación SUNAT', href: '/billing', icon: Receipt },
    { name: 'Importar Excel', href: '/imports', icon: FileSpreadsheet },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white text-slate-700 select-none overflow-x-hidden">
      {!collapsed ? (
        <div className="pt-3.5 pb-2 px-5 border-b border-slate-100/80">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block shadow-2xs" />
            </div>
            <div className="flex items-center gap-1">
              {mobileOpen && (
                <button
                  onClick={onMobileClose}
                  className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  title="Colapsar menú"
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <Link href="/" onClick={onMobileClose} className="block py-1 focus:outline-none group">
            <img
              src="/logo.png"
              alt="ARCA Corporation"
              className="h-9 w-auto object-contain max-w-[170px] transition-transform group-hover:scale-[1.02]"
            />
          </Link>
        </div>
      ) : (
        <div className="pt-4 pb-3 px-2 flex flex-col items-center gap-3 border-b border-slate-100/80">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Expandir menú"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          <Link href="/" title="ARCA Corporation" className="p-1 block">
            <div className="w-9 h-9 rounded-xl bg-[#0A1A3B] text-white flex items-center justify-center font-serif font-black text-base shadow-sm">
              A
            </div>
          </Link>
        </div>
      )}

      <div className="px-4 py-3">
        {!collapsed ? (
          <Link
            href="/sales"
            onClick={onMobileClose}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>Nueva Venta</span>
          </Link>
        ) : (
          <Link
            href="/sales"
            onClick={onMobileClose}
            title="Nueva Venta"
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-blue-600 shadow-xs transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 scrollbar-none">
        <div className="space-y-0.5">
          {primaryItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg text-xs font-medium transition-all duration-150',
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                )}
              >
                {isActive && (
                  <span
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-blue-600',
                      collapsed ? 'left-0' : '-left-3',
                    )}
                  />
                )}

                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-800',
                  )}
                />

                {!collapsed && (
                  <span className="flex-1 truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {!collapsed && (
          <div className="pt-1">
            <button
              onClick={() => setOpenCategories(!openCategories)}
              className="w-full flex items-center justify-between px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span>Categorías</span>
              {openCategories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {openCategories && (
              <div className="space-y-0.5">
                {operationalCategories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={onMobileClose}
                    className="group flex items-center gap-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors px-3 py-1.5"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.dotColor }}
                    />
                    <span className="flex-1 truncate text-[11px] text-slate-600 group-hover:text-slate-900">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-1">
          {!collapsed ? (
            <button
              onClick={() => setOpenManagement(!openManagement)}
              className="w-full flex items-center justify-between px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span>Gestión</span>
              {openManagement ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <div className="w-full h-px bg-slate-100 my-2" />
          )}

          {(openManagement || collapsed) && (
            <div className="space-y-0.5">
              {managementItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg text-xs font-medium transition-colors',
                      collapsed ? 'justify-center px-2 py-2' : 'px-3 py-1.5',
                      isActive
                        ? 'text-blue-600 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                    )}
                  >
                    {isActive && (
                      <span
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-blue-600',
                          collapsed ? 'left-0' : '-left-3',
                        )}
                      />
                    )}

                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-800',
                      )}
                    />

                    {!collapsed && <span className="flex-1 truncate text-[11px]">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 bg-white">
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Administrador Ica' : 'Administrador Ica'}
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                {user?.role ? roleLabel[user.role] ?? user.role : 'Super Admin'}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden lg:block fixed left-0 top-0 h-screen bg-white z-30 border-r border-slate-200 sidebar-transition overflow-x-hidden"
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        }}
      >
        {content}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <aside
            className="relative flex flex-col bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 overflow-x-hidden"
            style={{ width: 'var(--sidebar-width)' }}
          >
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

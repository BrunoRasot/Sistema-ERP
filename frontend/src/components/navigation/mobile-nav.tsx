'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  DollarSign,
  Users,
  Boxes,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  onOpenMore: () => void;
  isMoreOpen?: boolean;
}

export function MobileNav({ onOpenMore, isMoreOpen = false }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Inicio',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      name: 'Ventas',
      href: '/sales',
      icon: DollarSign,
      isActive: pathname.startsWith('/sales'),
    },
    {
      name: 'Clientes',
      href: '/customers',
      icon: Users,
      isActive: pathname.startsWith('/customers'),
    },
    {
      name: 'Inventario',
      href: '/inventory',
      icon: Boxes,
      isActive: pathname.startsWith('/inventory'),
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-between max-w-lg mx-auto px-2 py-1.5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-150 active:scale-95 select-none',
                item.isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-all',
                  item.isActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'bg-transparent text-slate-400',
                )}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight mt-0.5 leading-tight',
                  item.isActive ? 'font-bold text-blue-600' : 'font-medium text-slate-500',
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
        <button
          onClick={onOpenMore}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-150 active:scale-95 select-none',
            isMoreOpen ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600',
          )}
        >
          <div
            className={cn(
              'p-1.5 rounded-xl transition-all',
              isMoreOpen ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-slate-400',
            )}
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={cn(
              'text-[10px] tracking-tight mt-0.5 leading-tight',
              isMoreOpen ? 'font-bold text-blue-600' : 'font-medium text-slate-500',
            )}
          >
            Más
          </span>
        </button>
      </div>
    </nav>
  );
}

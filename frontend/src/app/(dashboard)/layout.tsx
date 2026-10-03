'use client';

import React, { useState } from 'react';
import { Header } from '@/components/navigation/header';
import { Sidebar } from '@/components/navigation/sidebar';
import { MobileNav } from '@/components/navigation/mobile-nav';
import { BottomSheetMore } from '@/components/navigation/bottom-sheet-more';
import { ToastProvider } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased overflow-x-hidden lg:h-screen lg:overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 w-full transition-[padding] duration-200 overflow-x-hidden lg:h-screen lg:overflow-hidden',
          collapsed ? 'lg:pl-[var(--sidebar-collapsed-width)]' : 'lg:pl-[var(--sidebar-width)]',
        )}
      >
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
        />

        <main
          className={cn(
            'flex-1 w-full max-w-full min-w-0 transition-all duration-200',
            'max-w-2xl mx-auto px-3.5 sm:px-5 py-4 pb-24', // Móvil (< lg)
            'lg:max-w-none lg:mx-0 lg:px-6 xl:px-8 lg:py-4 lg:pb-4 lg:flex lg:flex-col lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden', // Desktop (>= lg)
          )}
        >
          {children}
        </main>
      </div>

      <div className="lg:hidden">
        <MobileNav
          onOpenMore={() => setIsMoreOpen(true)}
          isMoreOpen={isMoreOpen}
        />
      </div>

      <div className="lg:hidden">
        <BottomSheetMore
          isOpen={isMoreOpen}
          onClose={() => setIsMoreOpen(false)}
        />
      </div>
      </div>
    </ToastProvider>
  );
}

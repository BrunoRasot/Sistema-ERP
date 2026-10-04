import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNav } from '@/components/navigation/mobile-nav';
import { Sidebar } from '@/components/navigation/sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/sales',
}));

describe('Responsive Layout Tests: Mobile Bottom Nav vs Desktop Sidebar', () => {
  describe('Mobile Navigation (Bottom Bar)', () => {
    it('should render 5 primary navigation options: Inicio, Ventas, Clientes, Inventario, Más', () => {
      const handleOpenMore = vi.fn();
      render(<MobileNav onOpenMore={handleOpenMore} />);

      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.getByText('Ventas')).toBeInTheDocument();
      expect(screen.getByText('Clientes')).toBeInTheDocument();
      expect(screen.getByText('Inventario')).toBeInTheDocument();
      expect(screen.getByText('Más')).toBeInTheDocument();
    });

    it('should have responsive class lg:hidden so it only appears on mobile viewports', () => {
      const { container } = render(<MobileNav onOpenMore={vi.fn()} />);
      const navElement = container.querySelector('nav');
      expect(navElement).not.toBeNull();
      expect(navElement?.className).toContain('lg:hidden');
      expect(navElement?.className).toContain('fixed');
      expect(navElement?.className).toContain('bottom-0');
    });

    it('should trigger onOpenMore callback when clicking "Más" button', () => {
      const handleOpenMore = vi.fn();
      render(<MobileNav onOpenMore={handleOpenMore} />);

      const moreButton = screen.getByRole('button', { name: /Más/i });
      fireEvent.click(moreButton);

      expect(handleOpenMore).toHaveBeenCalledTimes(1);
    });
  });

  describe('Desktop Sidebar', () => {
    it('should render brand logo, dashboard link, and management options', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);

      expect(screen.getByText(/Vivelite/i)).toBeInTheDocument();
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Nueva Venta/i)).toBeInTheDocument();
    });

    it('should toggle collapse state via onToggleCollapse', () => {
      const handleToggle = vi.fn();
      render(<Sidebar collapsed={false} onToggleCollapse={handleToggle} />);

      const collapseButton = screen.getByTitle(/Colapsar menú/i);
      fireEvent.click(collapseButton);

      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

describe('Design System UI Components', () => {
  describe('StatCard', () => {
    it('renders title, value and subtitle correctly', () => {
      render(
        <StatCard
          title="Ventas Totales"
          value="S/ 12,450.00"
          subtitle="15 transacciones hoy"
          trend={{ value: '+12.5%', isPositive: true }}
        />
      );

      expect(screen.getByText('Ventas Totales')).toBeInTheDocument();
      expect(screen.getByText('S/ 12,450.00')).toBeInTheDocument();
      expect(screen.getByText('15 transacciones hoy')).toBeInTheDocument();
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
    });

    it('triggers onClick when clicked', () => {
      const handleClick = vi.fn();
      render(
        <StatCard
          title="Cobranzas"
          value="S/ 5,000"
          onClick={handleClick}
        />
      );

      fireEvent.click(screen.getByText('Cobranzas'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('PageHeader', () => {
    it('renders title, subtitle and action buttons', () => {
      render(
        <PageHeader
          title="Gestión de Clientes"
          subtitle="Directorio de clientes y créditos"
          actions={<button>Nuevo Cliente</button>}
        />
      );

      expect(screen.getByText('Gestión de Clientes')).toBeInTheDocument();
      expect(screen.getByText('Directorio de clientes y créditos')).toBeInTheDocument();
      expect(screen.getByText('Nuevo Cliente')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('renders pagination and handles page changes', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={handlePageChange}
          totalItems={50}
          pageSize={10}
        />
      );

      expect(screen.getByText('2 / 5')).toBeInTheDocument();
      expect(screen.getByText(/registros/i)).toBeInTheDocument();
      const prevButton = screen.getByText('Anterior');
      const nextButton = screen.getByText('Siguiente');

      fireEvent.click(prevButton);
      expect(handlePageChange).toHaveBeenCalledWith(1);

      fireEvent.click(nextButton);
      expect(handlePageChange).toHaveBeenCalledWith(3);
    });

    it('disables previous button on first page', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPageChange={vi.fn()}
        />
      );

      const prevButton = screen.getByText('Anterior').closest('button');
      expect(prevButton).toBeDisabled();
    });
  });

  describe('ConfirmDialog', () => {
    it('renders modal when open and handles confirm action', () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      render(
        <ConfirmDialog
          isOpen={true}
          title="¿Eliminar Registro?"
          description="Esta acción no se puede deshacer."
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      );

      expect(screen.getByText('¿Eliminar Registro?')).toBeInTheDocument();
      expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Sí, eliminar'));
      expect(handleConfirm).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Cancelar'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      render(
        <ConfirmDialog
          isOpen={false}
          title="¿Eliminar?"
          description="Test"
          onConfirm={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByText('¿Eliminar?')).not.toBeInTheDocument();
    });
  });
});

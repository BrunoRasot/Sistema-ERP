import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PosTerminal } from '@/features/sales/components/pos-terminal';
import { Product } from '@/features/products/types/product';
import { Customer } from '@/features/customers/types/customer';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    code: 'AGUA-20L',
    name: 'Bidón 20L Agua Purificada',
    categoryId: 'cat-1',
    price: 15.0,
    cost: 4.5,
    unit: 'BIDON_20L',
    stock: 50,
    minStock: 10,
    isReturnable: true,
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'prod-2',
    code: 'DISP-01',
    name: 'Dispensador de Mesa',
    categoryId: 'cat-2',
    price: 35.0,
    cost: 15.0,
    unit: 'UNIDAD',
    stock: 20,
    minStock: 5,
    isReturnable: false,
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    documentType: 'DNI',
    documentNumber: '12345678',
    name: 'Juan Perez',
    phone: '987654321',
    address: 'Av. Los Próceres 123',
    zone: 'Central',
    district: 'Lima',
    customerType: 'HOGAR',
    subchannel: 'MOSTRADOR',
    bottlesHolding: 2,
    currentDebt: 0,
    creditLimit: 200,
    loyaltyTier: 'BRONCE',
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('Unit Test: PosTerminal Component', () => {
  it('should block cash sale and show error when cash shift is closed', async () => {
    render(
      <PosTerminal
        products={mockProducts}
        customers={mockCustomers}
        isShiftOpen={false}
        onSaleSuccess={vi.fn()}
      />,
    );

    // Add product to cart
    const productButton = screen.getByText('Bidón 20L Agua Purificada').closest('button');
    if (productButton) {
      fireEvent.click(productButton);
    }

    // Attempt to submit sale in cash with closed shift
    const submitButton = screen.getByRole('button', { name: /Cobrar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Debe aperturar un turno de caja para registrar cobros en efectivo/i),
      ).toBeInTheDocument();
    });
  });

  it('should display products and allow adding them to the cart', () => {
    render(
      <PosTerminal
        products={mockProducts}
        customers={mockCustomers}
        isShiftOpen={true}
        onSaleSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText('Bidón 20L Agua Purificada')).toBeInTheDocument();
    expect(screen.getByText('Dispensador de Mesa')).toBeInTheDocument();

    const productButton = screen.getByText('Bidón 20L Agua Purificada').closest('button');
    if (productButton) {
      fireEvent.click(productButton);
    }

    const totalDisplays = screen.getAllByText(/15[.,]00/);
    expect(totalDisplays.length).toBeGreaterThan(0);
  });

  it('should allow incrementing quantity and updating total', () => {
    render(
      <PosTerminal
        products={mockProducts}
        customers={mockCustomers}
        isShiftOpen={true}
        onSaleSuccess={vi.fn()}
      />,
    );

    const productButton = screen.getByText('Bidón 20L Agua Purificada').closest('button');
    if (productButton) {
      fireEvent.click(productButton);
    }

    const plusButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('svg.lucide-plus') !== null,
    );
    if (plusButtons.length > 0) {
      fireEvent.click(plusButtons[0]);
    }

    const total30Displays = screen.getAllByText(/30[.,]00/);
    expect(total30Displays.length).toBeGreaterThan(0);
  });
});

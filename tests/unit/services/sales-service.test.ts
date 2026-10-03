import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesService } from '../../../backend/src/modules/sales/sales.service';
import { createPrismaMock } from '../../mocks/prisma.mock';
import { SaleType, PaymentStatus } from '@prisma/client';
import { mockCustomerDni, mockCustomerRuc } from '../../fixtures/customers/customers.fixture';
import { mockReturnableBottle20L, mockPackBottles625ml } from '../../fixtures/products/products.fixture';
import { mockCreateSaleContadoDto, mockCreateSaleCreditoDto } from '../../fixtures/sales/sales.fixture';

describe('Unit Test: SalesService', () => {
  let service: SalesService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    prismaMock.cashShift.findFirst.mockResolvedValue({ id: 'shift-1', status: 'ABIERTA' });
    service = new SalesService(prismaMock as any);
  });

  describe('create sale validations', () => {
    it('should throw BadRequestException if cash register is closed', async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomerDni);
      prismaMock.cashShift.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockCreateSaleContadoDto as any, 'usr-1'),
      ).rejects.toThrow('No se puede realizar ninguna venta porque la caja se encuentra cerrada');
    });

    it('should throw BadRequestException if sale items array is empty', async () => {
      await expect(
        service.create({ customerId: 'cust-1', items: [] } as any, 'usr-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      prismaMock.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockCreateSaleContadoDto as any, 'usr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if a product is not found', async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomerDni);
      prismaMock.product.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockCreateSaleContadoDto as any, 'usr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if product stock is insufficient', async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomerDni);
      prismaMock.product.findFirst.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 1, // Only 1 in stock, but DTO requests 2
      });

      await expect(
        service.create(mockCreateSaleContadoDto as any, 'usr-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for CONTADO sale if paid amount is less than total', async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomerDni);
      prismaMock.product.findFirst.mockResolvedValue(mockReturnableBottle20L);

      const underpaidSale = {
        ...mockCreateSaleContadoDto,
        payment: {
          paymentMethod: 'EFECTIVO',
          amount: 20.0, // Total is 48.00
        },
      };

      await expect(
        service.create(underpaidSale as any, 'usr-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for CREDITO sale if it exceeds customer credit limit', async () => {
      // Customer has debt 350.50, credit limit 200, new sale debt is 140 -> exceeds limit
      prismaMock.customer.findFirst.mockResolvedValue({
        ...mockCustomerRuc,
        creditLimit: 200,
        currentDebt: 150,
      });
      prismaMock.product.findFirst.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 100,
      });

      await expect(
        service.create(mockCreateSaleCreditoDto as any, 'usr-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create CONTADO sale when fully paid', async () => {
      prismaMock.customer.findFirst.mockResolvedValue(mockCustomerDni);
      prismaMock.product.findFirst
        .mockResolvedValueOnce(mockReturnableBottle20L)
        .mockResolvedValueOnce(mockPackBottles625ml);
      prismaMock.sale.count.mockResolvedValue(5);
      prismaMock.sale.create.mockResolvedValue({
        id: 'sale-new-001',
        saleNumber: 'VTA-2026-00006',
        total: 48.0,
        paymentStatus: PaymentStatus.PAGADO,
        customer: mockCustomerDni,
        items: [],
      });
      prismaMock.customer.update.mockResolvedValue(mockCustomerDni);
      prismaMock.product.update.mockResolvedValue(mockReturnableBottle20L);
      prismaMock.cashMovement.create.mockResolvedValue({});
      prismaMock.bottleTransaction.create.mockResolvedValue({});
      prismaMock.inventoryMovement.create.mockResolvedValue({});
      prismaMock.auditLog.create.mockResolvedValue({});

      const result = await service.create(mockCreateSaleContadoDto as any, 'usr-1');

      expect(prismaMock.sale.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});

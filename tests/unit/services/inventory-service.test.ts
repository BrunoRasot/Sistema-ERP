import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../../../backend/src/modules/inventory/inventory.service';
import { createPrismaMock } from '../../mocks/prisma.mock';
import { InventoryMovementType } from '@prisma/client';
import { mockReturnableBottle20L } from '../../fixtures/products/products.fixture';
import {
  mockRegisterMovementEntrada,
  mockRegisterMovementSalida,
  mockRegisterMovementMerma,
  mockRegisterMovementAjuste,
} from '../../fixtures/inventory/inventory.fixture';

describe('Unit Test: InventoryService (Kardex & Stock Control)', () => {
  let service: InventoryService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    service = new InventoryService(prismaMock as any);
  });

  describe('registerMovement', () => {
    it('should throw NotFoundException if product is not found', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await expect(
        service.registerMovement(mockRegisterMovementEntrada as any, 'usr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should correctly increment stock on ENTRADA movement', async () => {
      prismaMock.product.findFirst.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 100,
      });

      prismaMock.inventoryMovement.create.mockImplementation((args) =>
        Promise.resolve({ id: 'mov-1', ...args.data }),
      );

      prismaMock.product.update.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 150,
      });

      const result = await service.registerMovement(mockRegisterMovementEntrada as any, 'usr-1');

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: mockReturnableBottle20L.id },
        data: { stock: 150 },
      });
      expect(result.newStock).toBe(150);
      expect(result.previousStock).toBe(100);
    });

    it('should throw BadRequestException if SALIDA exceeds available stock', async () => {
      prismaMock.product.findFirst.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 10, // Stock is 10, but SALIDA requests 20
      });

      await expect(
        service.registerMovement(mockRegisterMovementSalida as any, 'usr-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should decrement stock on valid SALIDA and MERMA', async () => {
      prismaMock.product.findFirst.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 100,
      });

      prismaMock.inventoryMovement.create.mockImplementation((args) =>
        Promise.resolve({ id: 'mov-2', ...args.data }),
      );
      prismaMock.product.update.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 80,
      });

      const resultSalida = await service.registerMovement(mockRegisterMovementSalida as any, 'usr-1');
      expect(resultSalida.newStock).toBe(80);

      // Test MERMA
      prismaMock.product.findFirst.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 80,
      });
      prismaMock.product.update.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 78,
      });

      const resultMerma = await service.registerMovement(mockRegisterMovementMerma as any, 'usr-1');
      expect(resultMerma.newStock).toBe(78);
    });

    it('should set exact physical count on AJUSTE movement', async () => {
      prismaMock.product.findFirst.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 100,
      });

      prismaMock.inventoryMovement.create.mockImplementation((args) =>
        Promise.resolve({ id: 'mov-3', ...args.data }),
      );
      prismaMock.product.update.mockResolvedValue({
        ...mockReturnableBottle20L,
        stock: 118,
      });

      const result = await service.registerMovement(mockRegisterMovementAjuste as any, 'usr-1');

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: mockReturnableBottle20L.id },
        data: { stock: 118 },
      });
      expect(result.newStock).toBe(118);
    });
  });
});

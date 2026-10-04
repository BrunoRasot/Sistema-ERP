import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      todaySalesAgg,
      activeOrdersCount,
      customersAgg,
      lowStockProducts,
      recentOrders,
      recentSales,
      activeShift,
    ] = await Promise.all([
      // Ventas de hoy
      this.prisma.sale.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          createdAt: { gte: startOfToday },
          paymentStatus: { not: PaymentStatus.ANULADO },
        },
      }),

      // Pedidos activos (en camino, preparación o pendientes)
      this.prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.PENDIENTE,
              OrderStatus.CONFIRMADO,
              OrderStatus.PREPARANDO,
              OrderStatus.EN_RUTA,
            ],
          },
        },
      }),

      // Total de bidones en poder de clientes y deuda total por cobrar (consulta unificada)
      this.prisma.customer.aggregate({
        _sum: {
          bottlesHolding: true,
          currentDebt: true,
        },
        where: { deletedAt: null },
      }),

      // Productos con stock bajo
      this.prisma.product.count({
        where: {
          stock: { lte: 10 },
          deletedAt: null,
        },
      }),

      // Pedidos recientes (últimos 5)
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, phone: true } },
          driver: { select: { firstName: true, lastName: true } },
        },
      }),

      // Ventas recientes (últimas 5)
      this.prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, documentNumber: true } },
          payments: { select: { paymentMethod: true } },
        },
      }),

      // Caja activa
      this.prisma.cashShift.findFirst({
        where: { status: 'ABIERTA' },
        orderBy: { openedAt: 'desc' },
        include: {
          cashRegister: true,
        },
      }),
    ]);

    // Ventas de los últimos 7 días para gráfico de barras semanal
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weekSales = await this.prisma.sale.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        paymentStatus: { not: PaymentStatus.ANULADO },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const chartMap: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayNames[d.getDay()];
      chartMap[key] = 0;
    }

    weekSales.forEach((s) => {
      const key = dayNames[new Date(s.createdAt).getDay()];
      if (chartMap[key] !== undefined) {
        chartMap[key] += Number(s.total);
      }
    });

    const weeklyChart = Object.keys(chartMap).map((day) => ({
      day,
      total: Math.round(chartMap[day] * 100) / 100,
    }));

    return {
      metrics: {
        todaySalesTotal: Number(todaySalesAgg._sum.total || 0),
        todaySalesCount: todaySalesAgg._count.id,
        activeOrdersCount,
        bottlesInHolding: customersAgg._sum.bottlesHolding || 0,
        totalPendingDebt: Number(customersAgg._sum.currentDebt || 0),
        lowStockCount: lowStockProducts,
        isShiftOpen: !!activeShift,
        cashRegisterName: activeShift?.cashRegister?.name || 'Caja Principal',
      },
      weeklyChart,
      recentOrders,
      recentSales,
    };
  }
}

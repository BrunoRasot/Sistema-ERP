import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { CreateSubChannelDto } from './dto/create-subchannel.dto';
import { UpdateSubChannelDto } from './dto/update-subchannel.dto';
import { CreateBottleConditionDto } from './dto/create-bottle-condition.dto';
import { UpdateBottleConditionDto } from './dto/update-bottle-condition.dto';
import { CreateBottleStockDto } from './dto/create-bottle-stock.dto';
import { UpdateBottleStockDto } from './dto/update-bottle-stock.dto';
import { VIVELITE_COMPANY, CompanyData } from '../billing/utils/ubl-builder';

@Injectable()
export class ConfigService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // No auto-seed en producción para permitir inicio 100% limpio
  }

  async seedDefaults(force = false) {
    if (force) {
      await this.prisma.subChannel.deleteMany();
      await this.prisma.district.deleteMany();
      await this.prisma.zone.deleteMany();
      await this.prisma.bottleCondition.deleteMany();
    }

    const zonesCount = await this.prisma.zone.count();
    if (zonesCount === 0 || force) {
      const icaZones = [
        {
          name: 'Zona 1 - Ica Centro & Metropolitana',
          districts: [
            'Ica Cercado',
            'La Tinguiña',
            'Parcona',
            'San Juan Bautista',
            'Comatrana / Huacachina',
            'Manzanilla / San Isidro',
          ],
        },
        {
          name: 'Zona 2 - Ica Norte & Salas Guadalupe',
          districts: [
            'Salas - Guadalupe (Centro / Plaza)',
            'Villacurí (Salas)',
            'Expansión Urbana (Guadalupe)',
            'Subtanjalla',
            'Macacona',
            'Santa Cruz de Villacurí / Fundos',
          ],
        },
        {
          name: 'Zona 3 - Ica Sur & Valle',
          districts: [
            'Los Aquijes',
            'Pueblo Nuevo (Ica)',
            'Tate',
            'Pachacútec',
            'Santiago',
            'Ocucaje',
            'Yauca del Rosario',
            'San José de los Molinos',
          ],
        },
        {
          name: 'Zona 4 - Provincia de Pisco',
          districts: [
            'Pisco Cercado',
            'San Andrés',
            'Paracas',
            'Túpac Amaru Inca',
            'San Clemente',
            'Huáncano',
            'Humay',
            'Independencia (Pisco)',
          ],
        },
        {
          name: 'Zona 5 - Provincia de Chincha',
          districts: [
            'Chincha Alta',
            'Chincha Baja',
            'Sunampe',
            'Grocio Prado',
            'Pueblo Nuevo (Chincha)',
            'Alto Larán',
            'El Carmen',
            'Tambo de Mora',
          ],
        },
        {
          name: 'Zona 6 - Provincias de Nasca & Palpa',
          districts: [
            'Nasca Cercado',
            'Vista Alegre',
            'Marcona',
            'Palpa Cercado',
            'Santa Cruz (Palpa)',
            'Río Grande',
          ],
        },
      ];

      const defaultSubchannels = [
        'HOGAR',
        'EMPRESA / AGROEXPORTADORA',
        'BODEGA / MINIMARKET',
        'DELIVERY / RUTA',
        'HOTEL / RESTAURANTE / TURISMO',
        'MOSTRADOR / PLANTA',
        'WHATSAPP',
      ];

      for (const z of icaZones) {
        const zone = await this.prisma.zone.create({
          data: { name: z.name },
        });

        for (const distName of z.districts) {
          const district = await this.prisma.district.create({
            data: {
              name: distName,
              zoneId: zone.id,
            },
          });

          for (const subName of defaultSubchannels.slice(0, 4)) {
            await this.prisma.subChannel.create({
              data: {
                name: subName,
                districtId: district.id,
              },
            });
          }
        }
      }
    }

    const conditionsCount = await this.prisma.bottleCondition.count();
    if (conditionsCount === 0 || force) {
      const defaultConditions = [
        { code: 'RECARGA', description: 'Cambio de envase vacío por lleno (Solo líquido)' },
        { code: 'CON_ENVASE_NUEVO', description: 'Venta de agua con envase nuevo incluido' },
        { code: 'PRESTAMO', description: 'Entrega de envase en calidad de préstamo/comodato' },
        { code: 'SIN_ENVASE', description: 'Venta sin intercambio de envase' },
      ];
      for (const c of defaultConditions) {
        await this.prisma.bottleCondition.upsert({
          where: { code: c.code },
          update: { description: c.description },
          create: c,
        });
      }
    }

    const bottleStocksCount = await this.prisma.bottleStock.count();
    if (bottleStocksCount === 0 || force) {
      const firstStock = await this.prisma.bottleStock.findFirst();
      if (!firstStock) {
        await this.prisma.bottleStock.create({
          data: {
            productId: 1,
            totalEmpty: 150,
            totalFull: 350,
            threshold: 50,
          },
        });
      }
    }
  }

  async createZone(dto: CreateZoneDto) {
    return this.prisma.zone.create({ data: { name: dto.name } });
  }

  async findAllZones() {
    return this.prisma.zone.findMany({
      include: {
        districts: {
          include: {
            subChannels: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findZone(id: number) {
    return this.prisma.zone.findUnique({
      where: { id },
      include: { districts: { include: { subChannels: true } } },
    });
  }

  async updateZone(id: number, dto: UpdateZoneDto) {
    return this.prisma.zone.update({ where: { id }, data: { name: dto.name } });
  }

  async deleteZone(id: number) {
    return this.prisma.zone.delete({ where: { id } });
  }

  async createDistrict(dto: CreateDistrictDto) {
    return this.prisma.district.create({
      data: { name: dto.name, zoneId: dto.zoneId },
    });
  }

  async findAllDistricts(zoneId?: number) {
    return this.prisma.district.findMany({
      where: zoneId ? { zoneId } : undefined,
      include: { subChannels: true, zone: true },
      orderBy: { name: 'asc' },
    });
  }

  async findDistrict(id: number) {
    return this.prisma.district.findUnique({
      where: { id },
      include: { subChannels: true, zone: true },
    });
  }

  async updateDistrict(id: number, dto: UpdateDistrictDto) {
    return this.prisma.district.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.zoneId ? { zoneId: dto.zoneId } : {}),
      },
    });
  }

  async deleteDistrict(id: number) {
    return this.prisma.district.delete({ where: { id } });
  }

  async createSubChannel(dto: CreateSubChannelDto) {
    return this.prisma.subChannel.create({
      data: { name: dto.name, districtId: dto.districtId },
    });
  }

  async findAllSubChannels(districtId?: number) {
    return this.prisma.subChannel.findMany({
      where: districtId ? { districtId } : undefined,
      include: { district: { include: { zone: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findSubChannel(id: number) {
    return this.prisma.subChannel.findUnique({
      where: { id },
      include: { district: true },
    });
  }

  async updateSubChannel(id: number, dto: UpdateSubChannelDto) {
    return this.prisma.subChannel.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.districtId ? { districtId: dto.districtId } : {}),
      },
    });
  }

  async deleteSubChannel(id: number) {
    return this.prisma.subChannel.delete({ where: { id } });
  }

  async createBottleCondition(dto: CreateBottleConditionDto) {
    return this.prisma.bottleCondition.create({
      data: { code: dto.code.toUpperCase(), description: dto.description },
    });
  }

  async findAllBottleConditions() {
    return this.prisma.bottleCondition.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findBottleCondition(id: number) {
    return this.prisma.bottleCondition.findUnique({ where: { id } });
  }

  async updateBottleCondition(id: number, dto: UpdateBottleConditionDto) {
    return this.prisma.bottleCondition.update({
      where: { id },
      data: {
        ...(dto.code ? { code: dto.code.toUpperCase() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
  }

  async deleteBottleCondition(id: number) {
    return this.prisma.bottleCondition.delete({ where: { id } });
  }

  async createBottleStock(dto: CreateBottleStockDto) {
    return this.prisma.bottleStock.create({
      data: {
        productId: dto.productId || 1,
        zoneId: dto.zoneId ?? undefined,
        totalEmpty: dto.totalEmpty ?? 0,
        totalFull: dto.totalFull ?? 0,
        threshold: dto.threshold ?? 50,
      },
    });
  }

  async findAllBottleStocks() {
    return this.prisma.bottleStock.findMany({
      include: { zone: true },
      orderBy: { id: 'asc' },
    });
  }

  async updateBottleStock(id: number, dto: UpdateBottleStockDto) {
    return this.prisma.bottleStock.update({
      where: { id },
      data: {
        ...(dto.totalEmpty !== undefined ? { totalEmpty: dto.totalEmpty } : {}),
        ...(dto.totalFull !== undefined ? { totalFull: dto.totalFull } : {}),
        ...(dto.threshold !== undefined ? { threshold: dto.threshold } : {}),
        ...(dto.zoneId !== undefined ? { zoneId: dto.zoneId } : {}),
      },
    });
  }

  // -------- Global Bottle Analytics & Kardex --------
  async getBottleSummary() {
    const customerStats = await this.prisma.customer.aggregate({
      _sum: { bottlesHolding: true },
      _count: { id: true },
      where: { deletedAt: null },
    });

    const customersWithBottlesCount = await this.prisma.customer.count({
      where: { bottlesHolding: { gt: 0 }, deletedAt: null },
    });

    const plantStock = await this.prisma.bottleStock.aggregate({
      _sum: { totalEmpty: true, totalFull: true },
    });

    const totalEmptyInPlant = plantStock._sum.totalEmpty || 0;
    const totalFullInPlant = plantStock._sum.totalFull || 0;
    const totalInCustomers = customerStats._sum.bottlesHolding || 0;
    const totalBottlesInCirculation = totalInCustomers + totalEmptyInPlant + totalFullInPlant;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactionsCount = await this.prisma.bottleTransaction.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return {
      totalInCustomers,
      totalEmptyInPlant,
      totalFullInPlant,
      totalBottlesInCirculation,
      customersWithBottlesCount,
      totalCustomers: customerStats._count.id,
      recentTransactionsCount,
    };
  }

  async getBottleTransactions(page = 1, limit = 50, customerId?: string, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (customerId) {
      where.customerId = customerId;
    }
    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { documentNumber: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      this.prisma.bottleTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              documentNumber: true,
              phone: true,
              zone: true,
              district: true,
              subchannel: true,
              bottlesHolding: true,
            },
          },
          sale: {
            select: {
              saleNumber: true,
              total: true,
            },
          },
          recordedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.bottleTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  getCompany(): CompanyData {
    return VIVELITE_COMPANY;
  }

  updateCompany(dto: Partial<CompanyData>): CompanyData {
    if (dto.ruc) VIVELITE_COMPANY.ruc = dto.ruc;
    if (dto.razonSocial) VIVELITE_COMPANY.razonSocial = dto.razonSocial;
    if (dto.nombreComercial) VIVELITE_COMPANY.nombreComercial = dto.nombreComercial;
    if (dto.address) VIVELITE_COMPANY.address = dto.address;
    if (dto.phone !== undefined) VIVELITE_COMPANY.phone = dto.phone;
    if (dto.district) VIVELITE_COMPANY.district = dto.district;
    if (dto.province) VIVELITE_COMPANY.province = dto.province;
    if (dto.department) VIVELITE_COMPANY.department = dto.department;
    if (dto.ubigeo) VIVELITE_COMPANY.ubigeo = dto.ubigeo;
    return VIVELITE_COMPANY;
  }
}

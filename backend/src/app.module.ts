import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CashModule } from './modules/cash/cash.module';
import { SalesModule } from './modules/sales/sales.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BillingModule } from './modules/billing/billing.module';
import { ImportsModule } from './modules/imports/imports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AppSettingsConfigModule } from './modules/config/config.module';
import { UsersModule } from './modules/users/users.module';
import { QueueModule } from './modules/queue/queue.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    QueueModule,
    AuthModule,
    HealthModule,
    CustomersModule,
    ProductsModule,
    InventoryModule,
    CashModule,
    SalesModule,
    OrdersModule,
    PaymentsModule,
    BillingModule,
    ImportsModule,
    DashboardModule,
    AppSettingsConfigModule,
    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

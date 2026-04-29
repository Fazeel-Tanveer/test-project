import { Module } from '@nestjs/common';
import { DataModule } from './data/data.module';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [DataModule, CatalogModule, OrdersModule],
})
export class AppModule {}

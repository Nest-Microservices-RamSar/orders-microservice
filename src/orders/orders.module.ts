import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, PRODUCTS_MICROSERVICE } from 'src/config';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    ClientsModule.register([
      {
        name: PRODUCTS_MICROSERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.productMicroservicesHost,
          port: envs.productMicroservicesPort,
        },
      },
    ]),
  ],
})
export class OrdersModule {}

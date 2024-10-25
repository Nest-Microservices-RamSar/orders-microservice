import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrdersPaginatioDto } from 'src/common/dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to Database');
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({ data: createOrderDto });
  }

  async findAll(orderPaginationDto: OrdersPaginatioDto) {
    const { page, limit } = orderPaginationDto;

    const totalItems = await this.order.count({
      where: {
        status: orderPaginationDto.status,
        isActive: true,
      },
    });
    const totalPages = Math.ceil(totalItems / limit);

    if (page > totalPages) {
      throw new RpcException({
        message: `Page not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    return {
      meta: {
        page,
        limit,
        totalPages,
        totalItems,
      },
      data: await this.order.findMany({
        where: {
          status: orderPaginationDto.status,
          isActive: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({ where: { id } });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    return order;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}

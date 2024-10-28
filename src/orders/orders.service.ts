import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OrdersStatus, PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrdersPaginatioDto } from 'src/common/dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PRODUCTS_MICROSERVICE } from 'src/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  constructor(
    @Inject(PRODUCTS_MICROSERVICE)
    private readonly productsClient: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to Database');
  }

  async create(createOrderDto: CreateOrderDto) {
    const ids = [5, 6, 500];

    const products = await firstValueFrom(
      this.productsClient
        .send(
          {
            cmd: 'validate_products',
          },
          ids,
        )
        .pipe(
          catchError((error) => {
            throw new RpcException(error);
          }),
        ),
    );

    return products;

    // return {
    //   service: 'Orders Microservice',
    //   createOrderDto: createOrderDto,
    // };

    // return this.order.create({ data: createOrderDto });
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

  async updateStatus(updateOrderStatusDto: UpdateOrderStatusDto) {
    const { id, status } = updateOrderStatusDto;

    // return updateOrderStatusDto;

    const order = await this.findOne(id);

    if (order.status == status) {
      return order;
    }

    return this.order.update({
      where: {
        id,
      },
      data: { status: status },
    });
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}

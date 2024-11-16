import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { OrdersPaginatioDto } from 'src/common/dto';
import { NATS_SERVICE } from 'src/config';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderWithProducts } from 'src/interfaces/order-with-products.interface';
import { PaidOrderDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to Database');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      // 1. Confirmar los Ids de los productos
      const productsIds = createOrderDto.items.map((item) => item.productId);
      const products: any[] = await firstValueFrom(
        this.client.send({ cmd: 'validate_products' }, productsIds),
      );

      // 2. Calcular valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;

        return price * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      // 3. Create una transaction db
      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => {
                return {
                  price: products.find(
                    (product) => product.id === orderItem.productId,
                  ).price,
                  productId: orderItem.productId,
                  quantity: orderItem.quantity,
                };
              }),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => {
          return {
            ...orderItem,
            name: products.find((product) => product.id === orderItem.productId)
              .name,
          };
        }),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs',
      });
    }
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
    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    const productIds = order.OrderItem.map((orderItem) => orderItem.productId);

    const products: any[] = await firstValueFrom(
      this.client.send({ cmd: 'validate_products' }, productIds),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => {
        return {
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name,
        };
      }),
    };
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

  async createPaymentSession(order: OrderWithProducts) {
    const paymentSession = await firstValueFrom(
      this.client.send('create.payment.session', {
        orderId: order.id,
        currency: 'usd',
        items: order.OrderItem.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }),
    );

    return paymentSession;
  }

  async paidOrder(paidOrderDto: PaidOrderDto) {
    console.log('Creating the payment and updating the order status...');

    const updatedOrder = await this.order.update({
      where: { id: paidOrderDto.orderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        stripeChargeId: paidOrderDto.stripePaymentId,

        // La relacion con la tabla OrderReceipt
        OrderReceipt: {
          create: {
            receiptUrl: paidOrderDto.receiptUrl,
          },
        },
      },
    });

    return updatedOrder;
  }
}

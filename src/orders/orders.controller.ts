import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersPaginatioDto } from 'src/common/dto';
import { CreateOrderDto, PaidOrderDto, UpdateOrderStatusDto } from './dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);
    const paymentSession = await this.ordersService.createPaymentSession(order);

    return {
      order,
      paymentSession,
    };
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() orderPaginationDto: OrdersPaginatioDto) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('updateOrderStatus')
  updateOrderStatus(@Payload() updateOrderStatusDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(updateOrderStatusDto);
  }

  @EventPattern('payment.succeeded')
  paidOrder(@Payload() paidOrderDto: PaidOrderDto) {
    console.log('Sending the payment data....');
    console.log(paidOrderDto);
    return this.ordersService.paidOrder(paidOrderDto);
  }
}

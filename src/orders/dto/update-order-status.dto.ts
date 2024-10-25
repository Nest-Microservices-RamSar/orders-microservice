import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';
import { OrdersStatus } from '@prisma/client';
export class UpdateOrderStatusDto {
  @IsUUID()
  public id: string;

  @IsEnum(OrderStatusList, {
    message: 'Posible statues are: ' + OrderStatusList.join(' ,'),
  })
  public status?: OrdersStatus;
}

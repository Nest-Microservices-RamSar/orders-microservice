import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';
import { OrdersStatus } from '@prisma/client';
import { OrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  public items: OrderItemDto[];
}

// export class CreateOrderDto {
//   @IsNumber()
//   @IsPositive()
//   public totalAmount: number;

//   @IsNumber()
//   @IsPositive()
//   public totalItems: number;

//   @IsEnum(OrderStatusList, {
//     message: `Order status must be one of: ${OrderStatusList.join(', ')}`,
//   })
//   @IsOptional()
//   public status: OrdersStatus = OrdersStatus.PENDING;

//   @IsBoolean()
//   @IsOptional()
//   public paid: boolean = false;
// }

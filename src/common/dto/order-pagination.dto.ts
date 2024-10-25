import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { OrdersStatus } from '@prisma/client';

export class OrdersPaginatioDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrdersStatus, {
    message: `Possible statues values area: ${OrdersStatus}`,
  })
  public status?: OrdersStatus;
}

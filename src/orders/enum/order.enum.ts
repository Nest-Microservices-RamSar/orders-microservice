import { OrdersStatus } from '@prisma/client';

export const OrderStatusList = [
  OrdersStatus.PENDING,
  OrdersStatus.CANCELLED,
  OrdersStatus.DELIVERED,
];

import type { PrismaClient } from '@prisma/client';
import { deriveOrderStatus, type OrderStatus } from '../../domain/order-status.ts';
import type { PizzeriaQuote } from '../pizzerias/comparison.service.ts';
import type { PizzaRequest } from '../../domain/pizza-matching.ts';

export function createOrder(
  prisma: PrismaClient,
  userId: string,
  request: PizzaRequest,
  quote: PizzeriaQuote,
  deliveryLocation: { lat: number; lng: number },
) {
  return prisma.order.create({
    data: {
      userId,
      size: request.size,
      crust: request.crust,
      sauce: request.sauce,
      toppings: request.toppings,
      pizzeriaId: quote.pizzeriaId,
      pizzeriaName: quote.pizzeriaName,
      pizzeriaLat: quote.pizzeriaLat,
      pizzeriaLng: quote.pizzeriaLng,
      deliveryLat: deliveryLocation.lat,
      deliveryLng: deliveryLocation.lng,
      priceAgorot: quote.priceAgorot,
      distanceKm: quote.distanceKm,
      etaMinutes: quote.etaMinutes,
    },
  });
}

export function listOrders(prisma: PrismaClient, userId: string) {
  return prisma.order.findMany({ where: { userId }, orderBy: { placedAt: 'desc' } });
}

export async function findOrder(prisma: PrismaClient, userId: string, id: string) {
  return prisma.order.findFirst({ where: { id, userId } });
}

export class OrderNotCancellableError extends Error {}

export async function cancelOrder(prisma: PrismaClient, userId: string, id: string) {
  const order = await findOrder(prisma, userId, id);
  if (!order) return null;

  const status = deriveOrderStatus(order.placedAt, order.etaMinutes, order.cancelledAt);
  if (status === 'DELIVERED' || status === 'CANCELLED') throw new OrderNotCancellableError();

  return prisma.order.update({ where: { id: order.id }, data: { cancelledAt: new Date() } });
}

export function withStatus<T extends { placedAt: Date; etaMinutes: number | null; cancelledAt: Date | null }>(
  order: T,
): T & { status: OrderStatus } {
  return { ...order, status: deriveOrderStatus(order.placedAt, order.etaMinutes, order.cancelledAt) };
}

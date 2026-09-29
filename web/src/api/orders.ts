import type { PizzaConfig } from './catalog.ts';
import { apiFetch } from './client.ts';
import type { Coordinates } from './pizzerias.ts';

export type OrderStatus = 'PLACED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface Order extends PizzaConfig {
  id: string;
  pizzeriaId: string;
  pizzeriaName: string;
  pizzeriaLat: number;
  pizzeriaLng: number;
  deliveryLat: number;
  deliveryLng: number;
  priceAgorot: number;
  distanceKm: number;
  etaMinutes: number | null;
  placedAt: string;
  cancelledAt: string | null;
  status: OrderStatus;
}

export const placeOrder = (pizzeriaId: string, config: PizzaConfig, delivery: Coordinates) =>
  apiFetch<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      pizzeriaId,
      ...config,
      deliveryLat: delivery.lat,
      deliveryLng: delivery.lng,
    }),
  });

export const listOrders = () => apiFetch<Order[]>('/orders');

export const fetchOrder = (id: string) => apiFetch<Order>(`/orders/${id}`);

export const cancelOrder = (id: string) => apiFetch<Order>(`/orders/${id}/cancel`, { method: 'POST' });

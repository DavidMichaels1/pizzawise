import type { ComparisonResult, PizzaRequest } from './config.ts';

const API_BASE_URL = process.env.PIZZAWISE_API_BASE_URL ?? 'https://api-production-43395.up.railway.app';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...init } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `Request failed with status ${res.status}`);
  return body as T;
}

export interface AuthResult {
  token: string;
  user: { id: string; name: string; email: string };
}

export const register = (email: string, password: string, name: string) =>
  request<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });

export const login = (email: string, password: string) =>
  request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const comparePizzerias = (body: PizzaRequest & { lat: number; lng: number }) =>
  request<{ results: ComparisonResult[] }>('/pizzerias/compare', { method: 'POST', body: JSON.stringify(body) });

export interface Order {
  id: string;
  pizzeriaName: string;
  size: string;
  crust: string;
  sauce: string;
  toppings: string[];
  priceAgorot: number;
  distanceKm: number;
  etaMinutes: number | null;
  status: 'PLACED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  placedAt: string;
}

export const createOrder = (
  token: string,
  body: PizzaRequest & { pizzeriaId: string; deliveryLat: number; deliveryLng: number },
) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(body), token });

export const listOrders = (token: string) => request<Order[]>('/orders', { token });

export const getOrder = (token: string, id: string) => request<Order>(`/orders/${id}`, { token });

export const cancelOrder = (token: string, id: string) =>
  request<Order>(`/orders/${id}/cancel`, { method: 'POST', token });

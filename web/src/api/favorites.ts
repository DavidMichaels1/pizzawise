import type { PizzaConfig } from './catalog.ts';
import { apiFetch } from './client.ts';

export interface Favorite extends PizzaConfig {
  id: string;
  name: string;
  createdAt: string;
}

export const listFavorites = () => apiFetch<Favorite[]>('/favorites');

export const createFavorite = (name: string, config: PizzaConfig) =>
  apiFetch<Favorite>('/favorites', { method: 'POST', body: JSON.stringify({ name, ...config }) });

export const deleteFavorite = (id: string) => apiFetch<void>(`/favorites/${id}`, { method: 'DELETE' });

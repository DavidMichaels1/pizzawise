import type { PizzaConfig, Topping } from './catalog.ts';
import { apiFetch } from './client.ts';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ComparisonResult {
  pizzeriaId: string;
  pizzeriaName: string;
  lat: number;
  lng: number;
  distanceKm: number;
  etaMinutes: number | null;
  priceAgorot: number;
  matchQuality: 'exact' | 'approximate';
  crustAvailable: boolean;
  sauceAvailable: boolean;
  missingToppings: Topping[];
}

export const comparePizzerias = (config: PizzaConfig, location: Coordinates) =>
  apiFetch<{ results: ComparisonResult[] }>('/pizzerias/compare', {
    method: 'POST',
    body: JSON.stringify({ ...config, ...location }),
  }).then((res) => res.results);

import { z } from 'zod';
import { env } from '../../env.ts';
import { normalizeEtaMinutes } from '../../domain/eta.ts';
import type { NormalizedMenu } from '../../domain/menu.ts';
import { shekelsToAgorot } from '../../domain/money.ts';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 300;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retries 429 (honoring Retry-After) and 5xx with exponential backoff. */
async function requestWithRetry(path: string): Promise<Response> {
  let response: Response;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    response = await fetch(`${env.pizzeriaApiBaseUrl}${path}`, {
      headers: { 'X-API-Key': env.pizzeriaApiKey },
    });

    const retryable = (response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES;
    if (!retryable) return response;

    const retryAfter = response.headers.get('retry-after');
    const delayMs = retryAfter ? Number(retryAfter) * 1000 : BASE_DELAY_MS * 2 ** attempt;
    await sleep(delayMs);
  }
  return response!;
}

const pizzeriaListSchema = z.object({
  pizzerias: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      lat: z.number(),
      lng: z.number(),
      avgEtaMinutes: z.union([z.number(), z.string(), z.null()]),
    }),
  ),
});

export interface Pizzeria {
  id: string;
  name: string;
  lat: number;
  lng: number;
  etaMinutes: number | null;
}

// The pizzeria list rarely changes and the upstream API is observed to have
// brief total outages (several seconds of 500s before recovering) on top of
// its documented per-pizzeria failures. A short TTL cache both avoids
// re-fetching all ~110 pizzerias on every comparison and, on a fresh fetch
// failure, falls back to serving the last known-good list rather than
// failing the whole request.
const LIST_CACHE_TTL_MS = 60_000;
let cachedList: { data: Pizzeria[]; expiresAt: number } | null = null;

export async function fetchPizzerias(): Promise<Pizzeria[]> {
  if (cachedList && cachedList.expiresAt > Date.now()) return cachedList.data;

  const res = await requestWithRetry('/pizzerias');
  if (!res.ok) {
    if (cachedList) return cachedList.data;
    throw new Error(`Pizzeria API error: ${res.status}`);
  }

  const { pizzerias } = pizzeriaListSchema.parse(await res.json());
  const data = pizzerias.map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    etaMinutes: normalizeEtaMinutes(p.avgEtaMinutes),
  }));
  cachedList = { data, expiresAt: Date.now() + LIST_CACHE_TTL_MS };
  return data;
}

const rawItem = z.object({ id: z.string(), label: z.string() });
const rawTopping = z.object({ id: z.string(), name: z.string() });

// The two menu shapes the API returns; only the price field placement differs.
const centsMenuSchema = z.object({
  pizzeriaId: z.string(),
  priceUnit: z.literal('cents'),
  menu: z.object({
    sizes: z.array(rawItem.extend({ priceCents: z.number() })),
    crusts: z.array(rawItem.extend({ priceCents: z.number() })),
    sauces: z.array(z.string()),
    toppings: z.array(rawTopping.extend({ priceCents: z.number() })),
  }),
});

const decimalMenuSchema = z.object({
  pizzeria_id: z.string(),
  price_unit: z.literal('decimal'),
  sizes: z.array(rawItem.extend({ price: z.number() })),
  crusts: z.array(rawItem.extend({ price: z.number() })),
  sauces: z.array(z.string()),
  toppings: z.array(rawTopping.extend({ price: z.number() })),
});

export function normalizeMenu(raw: unknown): NormalizedMenu {
  const cents = centsMenuSchema.safeParse(raw);
  if (cents.success) {
    const { pizzeriaId, menu } = cents.data;
    return {
      pizzeriaId,
      sizes: menu.sizes.map((s) => ({ id: s.id, label: s.label, priceAgorot: s.priceCents })),
      crusts: menu.crusts.map((c) => ({ id: c.id, label: c.label, priceAgorot: c.priceCents })),
      sauces: menu.sauces,
      toppings: menu.toppings.map((t) => ({ id: t.id, name: t.name, priceAgorot: t.priceCents })),
    };
  }

  const decimal = decimalMenuSchema.parse(raw);
  return {
    pizzeriaId: decimal.pizzeria_id,
    sizes: decimal.sizes.map((s) => ({ id: s.id, label: s.label, priceAgorot: shekelsToAgorot(s.price) })),
    crusts: decimal.crusts.map((c) => ({ id: c.id, label: c.label, priceAgorot: shekelsToAgorot(c.price) })),
    sauces: decimal.sauces,
    toppings: decimal.toppings.map((t) => ({
      id: t.id,
      name: t.name,
      priceAgorot: shekelsToAgorot(t.price),
    })),
  };
}

export type MenuResult =
  | { status: 'ok'; menu: NormalizedMenu }
  | { status: 'not_found' }
  | { status: 'unavailable' };

/** Never throws: a dead or malformed-response pizzeria is reported as 'unavailable', not an exception. */
export async function fetchMenu(pizzeriaId: string): Promise<MenuResult> {
  try {
    const res = await requestWithRetry(`/pizzerias/${pizzeriaId}/menu`);
    if (res.status === 404) return { status: 'not_found' };
    if (!res.ok) return { status: 'unavailable' };
    return { status: 'ok', menu: normalizeMenu(await res.json()) };
  } catch {
    return { status: 'unavailable' };
  }
}

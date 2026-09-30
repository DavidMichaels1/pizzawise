import { distanceKm, type Coordinates } from '../../domain/geo.ts';
import { matchPizzaAgainstMenu, type MatchedPizza, type PizzaRequest } from '../../domain/pizza-matching.ts';
import { rankByValue } from '../../domain/ranking.ts';
import { fetchMenu, fetchPizzerias } from './pizzeria-api-client.ts';

export type { PizzaRequest } from '../../domain/pizza-matching.ts';

export interface FetchLogger {
  warn: (obj: Record<string, unknown>, msg: string) => void;
}

const noopLogger: FetchLogger = { warn: () => {} };

export interface ComparisonResult extends MatchedPizza {
  pizzeriaId: string;
  pizzeriaName: string;
  lat: number;
  lng: number;
  distanceKm: number;
  etaMinutes: number | null;
}

const NEARBY_CANDIDATE_LIMIT = 25;

/**
 * Ranks nearby pizzerias for a canonical pizza request. We geographically
 * pre-filter to the nearest candidates before fetching any menus — this is
 * both what "nearby pizzerias" means and it avoids hammering the upstream
 * API with all ~110 pizzerias on every search. A pizzeria whose menu fails
 * to load (404, 5xx, or a malformed payload) is silently excluded rather
 * than failing the whole comparison — see pizzeria-api-client's MenuResult.
 */
export async function comparePizzerias(
  request: PizzaRequest,
  deliveryLocation: Coordinates,
  nearbyLimit = NEARBY_CANDIDATE_LIMIT,
  logger: FetchLogger = noopLogger,
): Promise<ComparisonResult[]> {
  const pizzerias = await fetchPizzerias();

  const nearby = pizzerias
    .map((pizzeria) => ({ pizzeria, distanceKm: distanceKm(deliveryLocation, pizzeria) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, nearbyLimit);

  const withMenus = await Promise.all(
    nearby.map(async (candidate) => ({ ...candidate, menuResult: await fetchMenu(candidate.pizzeria.id) })),
  );

  const results: ComparisonResult[] = [];
  for (const { pizzeria, distanceKm: distance, menuResult } of withMenus) {
    if (menuResult.status !== 'ok') {
      logger.warn(
        { pizzeriaId: pizzeria.id, pizzeriaName: pizzeria.name, reason: menuResult.status },
        'Excluded pizzeria from comparison: menu fetch failed',
      );
      continue;
    }

    results.push({
      pizzeriaId: pizzeria.id,
      pizzeriaName: pizzeria.name,
      lat: pizzeria.lat,
      lng: pizzeria.lng,
      distanceKm: distance,
      etaMinutes: pizzeria.etaMinutes,
      ...matchPizzaAgainstMenu(menuResult.menu, request),
    });
  }

  return rankByValue(results);
}

export interface PizzeriaQuote extends MatchedPizza {
  pizzeriaId: string;
  pizzeriaName: string;
  pizzeriaLat: number;
  pizzeriaLng: number;
  distanceKm: number;
  etaMinutes: number | null;
}

export type QuoteResult =
  | { status: 'ok'; quote: PizzeriaQuote }
  | { status: 'not_found' }
  | { status: 'unavailable' };

/**
 * Prices one specific pizzeria at order time. Used instead of trusting a
 * client-submitted price from an earlier /compare call, which could be
 * stale or tampered with — the server always re-derives the price it
 * charges from the live menu.
 */
export async function quotePizzeria(
  pizzeriaId: string,
  request: PizzaRequest,
  deliveryLocation: Coordinates,
): Promise<QuoteResult> {
  const pizzerias = await fetchPizzerias();
  const pizzeria = pizzerias.find((p) => p.id === pizzeriaId);
  if (!pizzeria) return { status: 'not_found' };

  const menuResult = await fetchMenu(pizzeriaId);
  if (menuResult.status !== 'ok') return { status: 'unavailable' };

  return {
    status: 'ok',
    quote: {
      pizzeriaId: pizzeria.id,
      pizzeriaName: pizzeria.name,
      pizzeriaLat: pizzeria.lat,
      pizzeriaLng: pizzeria.lng,
      distanceKm: distanceKm(deliveryLocation, pizzeria),
      etaMinutes: pizzeria.etaMinutes,
      ...matchPizzaAgainstMenu(menuResult.menu, request),
    },
  };
}

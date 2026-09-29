import type { FastifyPluginAsync } from 'fastify';
import { CRUSTS, SAUCES, SIZES, TOPPINGS } from '../../domain/catalog-enums.ts';
import { comparePizzerias, type PizzaRequest } from './comparison.service.ts';

const compareBodySchema = {
  body: {
    type: 'object',
    required: ['size', 'crust', 'sauce', 'toppings', 'lat', 'lng'],
    properties: {
      size: { type: 'string', enum: SIZES },
      crust: { type: 'string', enum: CRUSTS },
      sauce: { type: 'string', enum: SAUCES },
      toppings: { type: 'array', items: { type: 'string', enum: TOPPINGS } },
      lat: { type: 'number' },
      lng: { type: 'number' },
    },
  },
} as const;

const pizzeriasRoutes: FastifyPluginAsync = async (app) => {
  app.post('/pizzerias/compare', { schema: compareBodySchema }, async (request) => {
    const { size, crust, sauce, toppings, lat, lng } = request.body as PizzaRequest & {
      lat: number;
      lng: number;
    };
    const results = await comparePizzerias({ size, crust, sauce, toppings }, { lat, lng });
    return { results };
  });
};

export default pizzeriasRoutes;

import type { FastifyPluginAsync } from 'fastify';
import { CRUSTS, SAUCES, SIZES, TOPPINGS } from '../../domain/catalog-enums.ts';
import type { PizzaRequest } from '../../domain/pizza-matching.ts';
import { quotePizzeria } from '../pizzerias/comparison.service.ts';
import { cancelOrder, createOrder, findOrder, listOrders, OrderNotCancellableError, withStatus } from './orders.service.ts';

const createOrderSchema = {
  body: {
    type: 'object',
    required: ['pizzeriaId', 'size', 'crust', 'sauce', 'toppings', 'deliveryLat', 'deliveryLng'],
    properties: {
      pizzeriaId: { type: 'string' },
      size: { type: 'string', enum: SIZES },
      crust: { type: 'string', enum: CRUSTS },
      sauce: { type: 'string', enum: SAUCES },
      toppings: { type: 'array', items: { type: 'string', enum: TOPPINGS } },
      deliveryLat: { type: 'number' },
      deliveryLng: { type: 'number' },
    },
  },
} as const;

const ordersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.post('/orders', { schema: createOrderSchema }, async (request, reply) => {
    const { pizzeriaId, deliveryLat, deliveryLng, ...pizzaRequest } = request.body as PizzaRequest & {
      pizzeriaId: string;
      deliveryLat: number;
      deliveryLng: number;
    };

    const quoteResult = await quotePizzeria(pizzeriaId, pizzaRequest, { lat: deliveryLat, lng: deliveryLng });
    if (quoteResult.status === 'not_found') {
      return reply.code(404).send({ error: 'Pizzeria not found' });
    }
    if (quoteResult.status === 'unavailable') {
      return reply.code(503).send({ error: 'Pizzeria is temporarily unavailable, try again' });
    }

    const order = await createOrder(app.prisma, request.user.sub, pizzaRequest, quoteResult.quote, {
      lat: deliveryLat,
      lng: deliveryLng,
    });
    return reply.code(201).send(withStatus(order));
  });

  app.get('/orders', async (request) => {
    const orders = await listOrders(app.prisma, request.user.sub);
    return orders.map(withStatus);
  });

  app.get('/orders/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await findOrder(app.prisma, request.user.sub, id);
    if (!order) return reply.code(404).send({ error: 'Order not found' });
    return withStatus(order);
  });

  app.post('/orders/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const order = await cancelOrder(app.prisma, request.user.sub, id);
      if (!order) return reply.code(404).send({ error: 'Order not found' });
      return withStatus(order);
    } catch (err) {
      if (err instanceof OrderNotCancellableError) {
        return reply.code(409).send({ error: 'Order can no longer be cancelled' });
      }
      throw err;
    }
  });
};

export default ordersRoutes;

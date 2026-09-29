import type { FastifyPluginAsync } from 'fastify';
import { CRUSTS, SAUCES, SIZES, TOPPINGS } from '../../domain/catalog-enums.ts';
import { createFavorite, deleteFavorite, listFavorites, type FavoriteInput } from './favorites.service.ts';

const createFavoriteSchema = {
  body: {
    type: 'object',
    required: ['name', 'size', 'crust', 'sauce', 'toppings'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 60 },
      size: { type: 'string', enum: SIZES },
      crust: { type: 'string', enum: CRUSTS },
      sauce: { type: 'string', enum: SAUCES },
      toppings: { type: 'array', items: { type: 'string', enum: TOPPINGS } },
    },
  },
} as const;

const favoritesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.post('/favorites', { schema: createFavoriteSchema }, async (request, reply) => {
    const input = request.body as FavoriteInput;
    const favorite = await createFavorite(app.prisma, request.user.sub, input);
    return reply.code(201).send(favorite);
  });

  app.get('/favorites', async (request) => {
    return listFavorites(app.prisma, request.user.sub);
  });

  app.delete('/favorites/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await deleteFavorite(app.prisma, request.user.sub, id);
    if (!deleted) return reply.code(404).send({ error: 'Favorite not found' });
    return reply.code(204).send();
  });
};

export default favoritesRoutes;

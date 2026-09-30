import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.ts';

// Needs `docker compose up -d` and the same .env as `npm run dev`.
describe('favorites routes (integration)', () => {
  let app: FastifyInstance;
  let token: string;
  let favoriteId: string;
  const email = `integration-favorites-${Date.now()}@example.com`;

  beforeAll(async () => {
    app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password: 'testpass123', name: 'Favorites Test' },
    });
    token = res.json().token;
  });

  afterAll(async () => {
    await app.prisma.user.deleteMany({ where: { email } }); // cascades to any leftover favorites
    await app.close();
  });

  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'GET', url: '/favorites' });
    expect(res.statusCode).toBe(401);
  });

  it('starts with an empty list', async () => {
    const res = await app.inject({ method: 'GET', url: '/favorites', headers: { authorization: `Bearer ${token}` } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('creates a favorite', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/favorites',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Test Favorite', size: 'MEDIUM', crust: 'THIN', sauce: 'TOMATO', toppings: ['PEPPERONI'] },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe('Test Favorite');
    favoriteId = body.id;
  });

  it('lists the created favorite', async () => {
    const res = await app.inject({ method: 'GET', url: '/favorites', headers: { authorization: `Bearer ${token}` } });
    expect(res.json()).toHaveLength(1);
  });

  it('rejects an unrecognized topping', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/favorites',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Bad', size: 'MEDIUM', crust: 'THIN', sauce: 'TOMATO', toppings: ['NOT_A_TOPPING'] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('deletes the favorite', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/favorites/${favoriteId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it('404s deleting a favorite that no longer exists', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/favorites/${favoriteId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

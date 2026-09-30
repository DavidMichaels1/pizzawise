import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.ts';

// Exercises the real HTTP layer (routing, JSON-schema validation, JWT
// issuing/verification) against a real Postgres via Fastify's inject() —
// the domain suite covers the pure logic, this covers the wiring around it.
// Needs `docker compose up -d` and the same .env as `npm run dev`.
describe('auth routes (integration)', () => {
  let app: FastifyInstance;
  const email = `integration-test-${Date.now()}@example.com`;
  const password = 'testpass123';

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('registers a new user and returns a token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password, name: 'Integration Test' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.token).toBeTypeOf('string');
    expect(body.user.email).toBe(email);
  });

  it('rejects registering the same email twice', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password, name: 'Integration Test' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: `short-${email}`, password: 'short', name: 'Integration Test' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
    expect(res.statusCode).toBe(200);
    expect(res.json().token).toBeTypeOf('string');
  });

  it('rejects login with the wrong password', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, password: 'wrongpassword' } });
    expect(res.statusCode).toBe(401);
  });

  it('rejects /auth/me without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const loginRes = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
    const { token } = loginRes.json();

    const res = await app.inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${token}` } });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe(email);
  });
});

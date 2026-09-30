import type { FastifyPluginAsync } from 'fastify';
import { EmailInUseError, InvalidCredentialsError, registerUser, verifyCredentials } from './auth.service.ts';

// Login validates a password against a stored hash, so it only needs a
// non-empty string — minLength is a signup-time policy, not a login one.
const loginBodySchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 },
    },
  },
} as const;

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/auth/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string', minLength: 1 },
          },
        },
      },
      // Tighter than the global default — this and /auth/login are the
      // endpoints a credential-stuffing attempt would actually hit.
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { email, password, name } = request.body as {
        email: string;
        password: string;
        name: string;
      };
      try {
        const user = await registerUser(app.prisma, email, password, name);
        const token = app.jwt.sign({ sub: user.id });
        return reply.code(201).send({ token, user: { id: user.id, email: user.email, name: user.name } });
      } catch (err) {
        if (err instanceof EmailInUseError) {
          return reply.code(409).send({ error: 'Email already in use' });
        }
        throw err;
      }
    },
  );

  app.post(
    '/auth/login',
    { schema: loginBodySchema, config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { email, password } = request.body as { email: string; password: string };
      try {
        const user = await verifyCredentials(app.prisma, email, password);
        const token = app.jwt.sign({ sub: user.id });
        return reply.send({ token, user: { id: user.id, email: user.email, name: user.name } });
      } catch (err) {
        if (err instanceof InvalidCredentialsError) {
          return reply.code(401).send({ error: 'Invalid email or password' });
        }
        throw err;
      }
    },
  );

  app.get('/auth/me', { preHandler: app.authenticate }, async (request) => {
    const { sub } = request.user;
    const user = await app.prisma.user.findUniqueOrThrow({ where: { id: sub } });
    return { id: user.id, email: user.email, name: user.name };
  });
};

export default authRoutes;

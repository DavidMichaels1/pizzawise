import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { env } from './env.ts';
import authRoutes from './modules/auth/auth.routes.ts';
import favoritesRoutes from './modules/favorites/favorites.routes.ts';
import ordersRoutes from './modules/orders/orders.routes.ts';
import pizzeriasRoutes from './modules/pizzerias/pizzerias.routes.ts';
import authPlugin from './plugins/auth.ts';
import prismaPlugin from './plugins/prisma.ts';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
  },
  // Railway terminates TLS at its edge and proxies to this container, so
  // without this every request's socket peer is Railway's proxy, not the
  // real client — making `request.ip` (and therefore per-IP rate limiting)
  // meaningless. This trusts the standard X-Forwarded-For chain instead.
  trustProxy: true,
});

app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

// @fastify/cors defaults `methods` to GET,HEAD,POST only — it does not
// infer this from registered routes, so DELETE (favorites) must be listed
// explicitly or the browser's preflight silently blocks it.
await app.register(cors, { origin: env.frontendOrigin, methods: ['GET', 'POST', 'DELETE'] });
// A generous global ceiling against abuse; login/register carry their own
// much tighter per-route limit against credential brute-forcing (see
// auth.routes.ts), since 100/min would do nothing to stop that.
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
await app.register(prismaPlugin);
await app.register(authPlugin);
await app.register(authRoutes);
await app.register(pizzeriasRoutes);
await app.register(favoritesRoutes);
await app.register(ordersRoutes);

app.listen({ port: env.port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

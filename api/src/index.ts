import { buildApp } from './app.ts';
import { env } from './env.ts';

const app = await buildApp();

app.listen({ port: env.port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

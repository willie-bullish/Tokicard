import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';

import { loadEnv } from './plugins/env.js';
import dbPlugin from './plugins/db.js';
import waitlistRoutes from './routes/waitlist.js';
import authRoutes from './routes/auth.js';
import questRoutes from './routes/quests.js';

const env = loadEnv();

const fastify = Fastify({
  logger: true,
});

await fastify.register(sensible);
await fastify.register(cors, {
  origin: env.frontendOrigin,
  credentials: true,
});
await fastify.register(dbPlugin, { env });
await fastify.register(fastifyJwt, {
  secret: env.jwtSecret,
  sign: {
    expiresIn: '7d',
  },
});

fastify.decorate('env', env);
fastify.decorate('authenticate', async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

await fastify.register(waitlistRoutes, { prefix: '/api' });
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(questRoutes, { prefix: '/api' });

fastify.get('/health', async (request, reply) => {
  try {
    await fastify.db.pool.query('SELECT 1');
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    request.log.error(error, 'Health check failed');
    reply.status(503);
    return {
      status: 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';

try {
  await fastify.listen({ port, host });
  fastify.log.info(`Server listening at http://${host}:${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}


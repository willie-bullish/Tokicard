import fastifyPlugin from 'fastify-plugin';
import Database from '../db/database.js';

async function dbPlugin(fastify, opts) {
  const db = new Database(opts.env);

  await db.ensureBaseSchema();

  fastify.decorate('db', db);
  fastify.decorate('pg', db.pool);

  fastify.addHook('onClose', async () => {
    await db.close();
  });
}

export default fastifyPlugin(dbPlugin, {
  name: 'postgres-connection',
});


const DEFAULT_QUESTS = [
  {
    slug: 'follow-x',
    title: 'Follow Tokicard on X',
    description: '@tokicard',
    points: 50,
    sortOrder: 1,
  },
  {
    slug: 'follow-instagram',
    title: 'Follow Tokicard on Instagram',
    description: '@tokicard',
    points: 50,
    sortOrder: 2,
  },
  {
    slug: 'join-telegram',
    title: 'Join the Tokicard Telegram community',
    description: 'Community updates',
    points: 50,
    sortOrder: 3,
  },
];

export default async function questRoutes(fastify) {
  await fastify.db.ensureQuestSchema();
  await fastify.db.seedQuests(DEFAULT_QUESTS);

  fastify.get(
    '/quests',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const userId = request.user.sub;
      const { rows } = await fastify.pg.query(
        `SELECT q.id,
                q.slug,
                q.title,
                q.description,
                q.points,
                q.sort_order,
                uq.completed_at
         FROM quests q
         LEFT JOIN user_quests uq
           ON uq.quest_id = q.id AND uq.user_id = $1
         ORDER BY q.sort_order ASC`,
        [userId]
      );

      return {
        quests: rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          points: Number(row.points),
          sortOrder: row.sort_order,
          completed: Boolean(row.completed_at),
          completedAt: row.completed_at,
        })),
      };
    }
  );

  fastify.post(
    '/quests/:slug/complete',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { slug } = request.params;
      const client = await fastify.pg.connect();

      try {
        await client.query('BEGIN');

        const { rows: questRows } = await client.query(
          'SELECT id, points FROM quests WHERE slug = $1',
          [slug]
        );

        if (!questRows.length) {
          throw fastify.httpErrors.notFound('Quest not found');
        }

        const quest = questRows[0];

        const { rows: existing } = await client.query(
          `SELECT completed_at
           FROM user_quests
           WHERE user_id = $1 AND quest_id = $2
           FOR UPDATE`,
          [userId, quest.id]
        );

        if (existing.length && existing[0].completed_at) {
          await client.query('ROLLBACK');
          return reply.send({
            message: 'Quest already completed',
            alreadyCompleted: true,
          });
        }

        if (!existing.length) {
          await client.query(
            `INSERT INTO user_quests (user_id, quest_id, completed_at, points_awarded)
             VALUES ($1, $2, NOW(), $3)`,
            [userId, quest.id, quest.points]
          );
        } else {
          await client.query(
            `UPDATE user_quests
             SET completed_at = NOW(),
                 points_awarded = $3
             WHERE user_id = $1 AND quest_id = $2`,
            [userId, quest.id, quest.points]
          );
        }

        await client.query(
          `UPDATE users
             SET points = COALESCE(points, 0) + $2,
                 updated_at = NOW()
           WHERE id = $1`,
          [userId, quest.points]
        );

        await client.query('COMMIT');

        return {
          message: 'Quest completed',
          pointsAwarded: quest.points,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        fastify.log.error(error, 'Failed to complete quest');
        throw fastify.httpErrors.internalServerError('Unable to complete quest');
      } finally {
        client.release();
      }
    }
  );
}


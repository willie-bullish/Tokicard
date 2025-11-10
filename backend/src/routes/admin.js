// Admin login schema
const adminLoginSchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    additionalProperties: false,
    properties: {
      username: { type: 'string' },
      password: { type: 'string' },
    },
  },
};

// Create quest schema
const createQuestSchema = {
  body: {
    type: 'object',
    required: ['slug', 'title', 'points'],
    additionalProperties: false,
    properties: {
      slug: { type: 'string', minLength: 1, maxLength: 100 },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string', maxLength: 500 },
      points: { type: 'integer', minimum: 0 },
      sortOrder: { type: 'integer', minimum: 0 },
    },
  },
};

// Update quest schema
const updateQuestSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string', maxLength: 500 },
      points: { type: 'integer', minimum: 0 },
      sortOrder: { type: 'integer', minimum: 0 },
    },
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
};

// Delete quest schema
const deleteQuestSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
};

export default async function adminRoutes(fastify) {
  // Admin login
  fastify.post(
    '/admin/login',
    { schema: adminLoginSchema },
    async (request, reply) => {
      const { username, password } = request.body;
      const adminUsername = fastify.env.admin.username;
      const adminPassword = fastify.env.admin.password;

      if (username !== adminUsername || password !== adminPassword) {
        throw fastify.httpErrors.unauthorized('Invalid admin credentials');
      }

      const token = fastify.jwt.sign({
        sub: 'admin',
        role: 'admin',
        username: adminUsername,
      });

      return {
        token,
        message: 'Admin login successful',
      };
    }
  );

  // Admin authentication middleware decorator
  fastify.decorate('authenticateAdmin', async function authenticateAdmin(request, reply) {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        throw fastify.httpErrors.unauthorized('Admin token required');
      }

      const decoded = fastify.jwt.verify(token);
      if (decoded.role !== 'admin') {
        throw fastify.httpErrors.forbidden('Admin access required');
      }
      request.admin = decoded;
    } catch (err) {
      if (err.statusCode) {
        throw err;
      }
      throw fastify.httpErrors.unauthorized('Invalid admin token');
    }
  });

  // Get user analytics
  fastify.get(
    '/admin/analytics',
    { preHandler: [fastify.authenticateAdmin] },
    async (request) => {
      // Total users
      const totalUsersRes = await fastify.pg.query(
        'SELECT COUNT(*)::int AS total FROM users'
      );
      const totalUsers = totalUsersRes.rows[0]?.total ?? 0;

      // Verified users
      const verifiedUsersRes = await fastify.pg.query(
        'SELECT COUNT(*)::int AS total FROM users WHERE is_verified = true'
      );
      const verifiedUsers = verifiedUsersRes.rows[0]?.total ?? 0;

      // Total points distributed
      const totalPointsRes = await fastify.pg.query(
        'SELECT COALESCE(SUM(points), 0)::bigint AS total FROM users'
      );
      const totalPoints = Number(totalPointsRes.rows[0]?.total ?? 0);

      // Total quests
      const totalQuestsRes = await fastify.pg.query(
        'SELECT COUNT(*)::int AS total FROM quests'
      );
      const totalQuests = totalQuestsRes.rows[0]?.total ?? 0;

      // Total quest completions
      const totalCompletionsRes = await fastify.pg.query(
        'SELECT COUNT(*)::int AS total FROM user_quests WHERE completed_at IS NOT NULL'
      );
      const totalCompletions = totalCompletionsRes.rows[0]?.total ?? 0;

      // Users registered in last 7 days
      const recentUsersRes = await fastify.pg.query(
        `SELECT COUNT(*)::int AS total 
         FROM users 
         WHERE created_at >= NOW() - INTERVAL '7 days'`
      );
      const recentUsers = recentUsersRes.rows[0]?.total ?? 0;

      // Users registered in last 30 days
      const monthlyUsersRes = await fastify.pg.query(
        `SELECT COUNT(*)::int AS total 
         FROM users 
         WHERE created_at >= NOW() - INTERVAL '30 days'`
      );
      const monthlyUsers = monthlyUsersRes.rows[0]?.total ?? 0;

      // Top quests by completion
      const topQuestsRes = await fastify.pg.query(
        `SELECT q.id, q.slug, q.title, q.points, COUNT(uq.user_id)::int AS completions
         FROM quests q
         LEFT JOIN user_quests uq ON q.id = uq.quest_id AND uq.completed_at IS NOT NULL
         GROUP BY q.id, q.slug, q.title, q.points
         ORDER BY completions DESC
         LIMIT 10`
      );

      // User growth over time (last 30 days)
      const growthRes = await fastify.pg.query(
        `SELECT 
           DATE(created_at) AS date,
           COUNT(*)::int AS count
         FROM users
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      );

      return {
        overview: {
          totalUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
          totalPoints,
          totalQuests,
          totalCompletions,
          recentUsers,
          monthlyUsers,
        },
        topQuests: topQuestsRes.rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          points: Number(row.points),
          completions: row.completions,
        })),
        userGrowth: growthRes.rows.map((row) => ({
          date: row.date,
          count: row.count,
        })),
      };
    }
  );

  // Get all quests (admin view)
  fastify.get(
    '/admin/quests',
    { preHandler: [fastify.authenticateAdmin] },
    async (request) => {
      const { rows } = await fastify.pg.query(
        `SELECT 
           q.id,
           q.slug,
           q.title,
           q.description,
           q.points,
           q.sort_order,
           q.created_at,
           q.updated_at,
           COUNT(uq.user_id)::int AS completion_count
         FROM quests q
         LEFT JOIN user_quests uq ON q.id = uq.quest_id AND uq.completed_at IS NOT NULL
         GROUP BY q.id, q.slug, q.title, q.description, q.points, q.sort_order, q.created_at, q.updated_at
         ORDER BY q.sort_order ASC, q.created_at ASC`
      );

      return {
        quests: rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          points: Number(row.points),
          sortOrder: row.sort_order,
          completionCount: row.completion_count,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      };
    }
  );

  // Create new quest
  fastify.post(
    '/admin/quests',
    { preHandler: [fastify.authenticateAdmin], schema: createQuestSchema },
    async (request) => {
      const { slug, title, description, points, sortOrder } = request.body;

      const { rows } = await fastify.pg.query(
        `INSERT INTO quests (slug, title, description, points, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, slug, title, description, points, sort_order, created_at, updated_at`,
        [slug, title, description || null, points, sortOrder || 100]
      );

      return {
        quest: {
          id: rows[0].id,
          slug: rows[0].slug,
          title: rows[0].title,
          description: rows[0].description,
          points: Number(rows[0].points),
          sortOrder: rows[0].sort_order,
          createdAt: rows[0].created_at,
          updatedAt: rows[0].updated_at,
        },
        message: 'Quest created successfully',
      };
    }
  );

  // Update quest
  fastify.put(
    '/admin/quests/:id',
    { preHandler: [fastify.authenticateAdmin], schema: updateQuestSchema },
    async (request) => {
      const { id } = request.params;
      const { title, description, points, sortOrder } = request.body;

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (points !== undefined) {
        updates.push(`points = $${paramIndex++}`);
        values.push(points);
      }
      if (sortOrder !== undefined) {
        updates.push(`sort_order = $${paramIndex++}`);
        values.push(sortOrder);
      }

      if (updates.length === 0) {
        throw fastify.httpErrors.badRequest('No fields to update');
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const { rows } = await fastify.pg.query(
        `UPDATE quests
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, slug, title, description, points, sort_order, created_at, updated_at`,
        values
      );

      if (rows.length === 0) {
        throw fastify.httpErrors.notFound('Quest not found');
      }

      return {
        quest: {
          id: rows[0].id,
          slug: rows[0].slug,
          title: rows[0].title,
          description: rows[0].description,
          points: Number(rows[0].points),
          sortOrder: rows[0].sort_order,
          createdAt: rows[0].created_at,
          updatedAt: rows[0].updated_at,
        },
        message: 'Quest updated successfully',
      };
    }
  );

  // Delete quest
  fastify.delete(
    '/admin/quests/:id',
    { preHandler: [fastify.authenticateAdmin], schema: deleteQuestSchema },
    async (request) => {
      const { id } = request.params;

      const { rows } = await fastify.pg.query(
        `DELETE FROM quests WHERE id = $1 RETURNING id, slug, title`,
        [id]
      );

      if (rows.length === 0) {
        throw fastify.httpErrors.notFound('Quest not found');
      }

      return {
        message: 'Quest deleted successfully',
        deletedQuest: {
          id: rows[0].id,
          slug: rows[0].slug,
          title: rows[0].title,
        },
      };
    }
  );
}


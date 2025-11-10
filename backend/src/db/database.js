import pg from 'pg';

const { Pool } = pg;

export default class Database {
  constructor(env) {
    this.env = env;
    this.pool = new Pool({
      connectionString: env.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async close() {
    await this.pool.end();
  }

  async ensureBaseSchema() {
    await this.pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE EXTENSION IF NOT EXISTS citext;

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        email CITEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        referral_code TEXT NOT NULL UNIQUE,
        referred_by UUID REFERENCES users(id),
        points INTEGER NOT NULL DEFAULT 0,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS waitlist_entries (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (status IN ('pending', 'verified'))
      );

      CREATE TABLE IF NOT EXISTS otp_codes (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        email CITEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        verification_id TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed BOOLEAN NOT NULL DEFAULT false,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup
        ON otp_codes (email, verification_id);

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        email CITEXT NOT NULL,
        token_hash TEXT NOT NULL,
        reset_id TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed BOOLEAN NOT NULL DEFAULT false,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_password_reset_lookup
        ON password_reset_tokens (email, reset_id);
    `);
  }

  async ensureQuestSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS quests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        points INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 100,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_quests (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
        completed_at TIMESTAMPTZ,
        points_awarded INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, quest_id)
      );
    `);
  }

  async seedQuests(quests) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const quest of quests) {
        await client.query(
          `INSERT INTO quests (slug, title, description, points, sort_order)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (slug) DO UPDATE
           SET title = EXCLUDED.title,
               description = EXCLUDED.description,
               points = EXCLUDED.points,
               sort_order = EXCLUDED.sort_order,
               updated_at = NOW()`,
          [quest.slug, quest.title, quest.description, quest.points, quest.sortOrder]
        );
      }

      const slugs = quests.map((quest) => quest.slug);
      if (slugs.length) {
        await client.query(
          `DELETE FROM user_quests
           WHERE quest_id IN (
             SELECT id FROM quests WHERE NOT (slug = ANY($1::text[]))
           )`,
          [slugs]
        );

        await client.query(
          `DELETE FROM quests
           WHERE NOT (slug = ANY($1::text[]))`,
          [slugs]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}


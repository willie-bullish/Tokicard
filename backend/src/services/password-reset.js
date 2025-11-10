import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

export async function createPasswordResetRecord(client, { userId, email, expiresInMinutes = 60 }) {
  const token = crypto.randomBytes(32).toString('hex');
  const resetId = nanoid();
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000);

  await client.query('DELETE FROM password_reset_tokens WHERE email = $1', [email.toLowerCase()]);

  await client.query(
    `INSERT INTO password_reset_tokens (user_id, email, token_hash, reset_id, expires_at, consumed)
     VALUES ($1, $2, $3, $4, $5, false)`,
    [userId, email.toLowerCase(), tokenHash, resetId, expiresAt]
  );

  return { token, resetId, expiresAt };
}

export async function consumePasswordResetRecord(client, { email, token, resetId }) {
  const { rows } = await client.query(
    `SELECT id, user_id, token_hash, expires_at, consumed
     FROM password_reset_tokens
     WHERE email = $1 AND reset_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [email.toLowerCase(), resetId]
  );

  if (!rows.length) {
    return { ok: false, reason: 'not_found' };
  }

  const record = rows[0];

  if (record.consumed) {
    return { ok: false, reason: 'consumed' };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  const matches = await bcrypt.compare(token, record.token_hash);
  if (!matches) {
    return { ok: false, reason: 'invalid' };
  }

  await client.query(
    `UPDATE password_reset_tokens
     SET consumed = true,
         consumed_at = NOW()
     WHERE id = $1`,
    [record.id]
  );

  await client.query(
    `DELETE FROM password_reset_tokens
     WHERE email = $1 AND reset_id <> $2`,
    [email.toLowerCase(), resetId]
  );

  return { ok: true, userId: record.user_id };
}


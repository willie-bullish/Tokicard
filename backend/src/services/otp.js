import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const OTP_LENGTH = 6;

function generateNumericOtp(length = OTP_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

export async function createOtpRecord(client, { userId, email, expiresInMinutes = 10 }) {
  const otp = generateNumericOtp();
  const verificationId = nanoid();
  const hash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000);

  await client.query(
    `INSERT INTO otp_codes (user_id, email, otp_hash, verification_id, expires_at, consumed)
     VALUES ($1, $2, $3, $4, $5, false)`,
    [userId, email.toLowerCase(), hash, verificationId, expiresAt]
  );

  return { otp, verificationId, expiresAt };
}

export async function verifyOtpRecord(client, { email, otp, verificationId }) {
  const { rows } = await client.query(
    `SELECT id, otp_hash, expires_at, consumed
     FROM otp_codes
     WHERE email = $1 AND verification_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [email.toLowerCase(), verificationId]
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

  const isMatch = await bcrypt.compare(otp, record.otp_hash);
  if (!isMatch) {
    return { ok: false, reason: 'invalid' };
  }

  await client.query(
    `UPDATE otp_codes
     SET consumed = true, consumed_at = NOW()
     WHERE id = $1`,
    [record.id]
  );

  return { ok: true };
}


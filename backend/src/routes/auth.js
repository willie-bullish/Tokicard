import { hashPassword, verifyPassword } from '../utils/password.js';
import { createOtpRecord, verifyOtpRecord } from '../services/otp.js';
import { createPasswordResetRecord, consumePasswordResetRecord } from '../services/password-reset.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/mailer.js';

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6, maxLength: 128 },
    },
  },
};

const REFERRAL_REWARD_POINTS = 100;

const verifyOtpSchema = {
  body: {
    type: 'object',
    required: ['email', 'otp', 'verificationId'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      otp: { type: 'string', minLength: 4, maxLength: 10 },
      verificationId: { type: 'string' },
    },
  },
};

const resendOtpSchema = {
  body: {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
    },
  },
};

const forgotPasswordSchema = {
  body: {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
    },
  },
};

const resetPasswordSchema = {
  body: {
    type: 'object',
    required: ['email', 'token', 'resetId', 'password'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      token: { type: 'string', minLength: 10, maxLength: 256 },
      resetId: { type: 'string', minLength: 6, maxLength: 128 },
      password: { type: 'string', minLength: 8, maxLength: 128 },
    },
  },
};

const referralsQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 50 },
    },
    additionalProperties: false,
  },
};

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    points: Number(row.points ?? 0),
    isVerified: row.is_verified,
  };
}

function maskEmailAddress(email) {
  if (!email) return '';
  const [localPart, domainPart] = email.split('@');
  if (!domainPart) return email;

  const maskedLocal = `${localPart.slice(0, 3)}***`;

  const [domainName, domainExt] = domainPart.split('.');
  if (!domainExt) {
    return `${maskedLocal}@***`;
  }

  return `${maskedLocal}@***.${domainExt}`;
}

export default async function authRoutes(fastify) {
  fastify.post(
    '/auth/login',
    { schema: loginSchema },
    async (request, reply) => {
      const { email, password } = request.body;
      const lowerEmail = email.toLowerCase();

      const { rows } = await fastify.pg.query(
        `SELECT id, full_name, email, phone, password_hash, referral_code, referred_by, points, is_verified
         FROM users
         WHERE email = $1`,
        [lowerEmail]
      );

      const user = rows[0];
      if (!user) {
        throw fastify.httpErrors.unauthorized('Invalid email or password');
      }

      const passwordValid = await verifyPassword(password, user.password_hash);
      if (!passwordValid) {
        throw fastify.httpErrors.unauthorized('Invalid email or password');
      }

      if (!user.is_verified) {
        throw fastify.httpErrors.forbidden('Account not verified. Please complete OTP verification.');
      }

      const token = fastify.jwt.sign({ sub: user.id, email: user.email });

      return {
        token,
        user: mapUserRow(user),
      };
    }
  );

  fastify.post(
    '/verify-otp',
    { schema: verifyOtpSchema },
    async (request, reply) => {
      const { email, otp, verificationId } = request.body;
      const lowerEmail = email.toLowerCase();
      const client = await fastify.pg.connect();

      try {
        await client.query('BEGIN');

        const userRes = await client.query(
          `SELECT id, full_name, email, phone, referral_code, referred_by, points, is_verified
           FROM users WHERE email = $1 FOR UPDATE`,
          [lowerEmail]
        );

        if (!userRes.rows.length) {
          throw fastify.httpErrors.notFound('User not found');
        }

        const existingUser = userRes.rows[0];
        const wasVerified = existingUser.is_verified;
        const referrerId = existingUser.referred_by;

        const verification = await verifyOtpRecord(client, {
          email: lowerEmail,
          otp,
          verificationId,
        });

        if (!verification.ok) {
          switch (verification.reason) {
            case 'expired':
              throw fastify.httpErrors.badRequest('OTP has expired. Please request a new one.');
            case 'invalid':
              throw fastify.httpErrors.badRequest('Incorrect OTP. Please try again.');
            case 'consumed':
              throw fastify.httpErrors.badRequest('OTP already used. Please request a new one.');
            default:
              throw fastify.httpErrors.badRequest('OTP verification failed.');
          }
        }

        const { rows: updated } = await client.query(
          `UPDATE users
             SET is_verified = true,
                 verified_at = NOW(),
                 updated_at = NOW()
           WHERE email = $1
           RETURNING id, full_name, email, phone, referral_code, referred_by, points, is_verified`,
          [lowerEmail]
        );

        let referrerReward = null;

        if (!wasVerified && referrerId) {
          const { rows: referrerRows } = await client.query(
            `UPDATE users
               SET points = points + $1,
                   updated_at = NOW()
             WHERE id = $2
             RETURNING id, full_name, email, phone, referral_code, referred_by, points, is_verified`,
            [REFERRAL_REWARD_POINTS, referrerId]
          );

          if (referrerRows.length) {
            referrerReward = {
              user: mapUserRow(referrerRows[0]),
              pointsAwarded: REFERRAL_REWARD_POINTS,
            };
          }
        }

        await client.query(
          `UPDATE waitlist_entries
             SET status = 'verified',
                 updated_at = NOW()
           WHERE user_id = $1`,
          [updated[0].id]
        );

        await client.query('COMMIT');

        const token = fastify.jwt.sign({ sub: updated[0].id, email: updated[0].email });

        return {
          token,
          user: mapUserRow(updated[0]),
          referralReward: referrerReward,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  );

  fastify.post(
    '/resend-otp',
    { schema: resendOtpSchema },
    async (request, reply) => {
      const { email } = request.body;
      const lowerEmail = email.toLowerCase();
      const client = await fastify.pg.connect();

      try {
        await client.query('BEGIN');

        const { rows } = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [lowerEmail]
        );

        if (!rows.length) {
          throw fastify.httpErrors.notFound('User not found');
        }

        const userId = rows[0].id;

        await client.query('DELETE FROM otp_codes WHERE email = $1', [lowerEmail]);

        const { otp, verificationId, expiresAt } = await createOtpRecord(client, {
          userId,
          email: lowerEmail,
          expiresInMinutes: fastify.env.otpExpiryMinutes,
        });

        try {
          await sendOtpEmail(fastify.env, {
            to: lowerEmail,
            otp,
            expiresAt,
          });
        } catch (error) {
          fastify.log.error(error, 'Failed to send OTP email (resend)');
          throw fastify.httpErrors.internalServerError(
            'Failed to deliver OTP email. Please try again shortly.'
          );
        }

        await client.query('COMMIT');

        const payload = {
          message: 'OTP resent successfully.',
          verificationId,
          expiresAt,
        };

        if (fastify.env.nodeEnv !== 'production') {
          payload.debugOtp = otp;
        }

        return payload;
      } catch (error) {
        await client.query('ROLLBACK');
        fastify.log.error(error, 'Failed to resend OTP');
        throw fastify.httpErrors.internalServerError('Unable to resend OTP');
      } finally {
        client.release();
      }
    }
  );

  fastify.post(
    '/auth/forgot-password',
    { schema: forgotPasswordSchema },
    async (request) => {
      const { email } = request.body;
      const lowerEmail = email.toLowerCase();
      const genericMessage =
        'If an account exists for that email, a password reset link has been sent.';
      const client = await fastify.pg.connect();

      try {
        await client.query('BEGIN');

        const { rows } = await client.query(
          `SELECT id, is_verified
           FROM users
           WHERE email = $1
           FOR UPDATE`,
          [lowerEmail]
        );

        if (!rows.length || !rows[0].is_verified) {
          await client.query('COMMIT');
          return { message: genericMessage };
        }

        const user = rows[0];

        const { token, resetId, expiresAt } = await createPasswordResetRecord(client, {
          userId: user.id,
          email: lowerEmail,
          expiresInMinutes: fastify.env.passwordResetExpiryMinutes,
        });

        const resetUrl = new URL('/reset-password', fastify.env.frontendOrigin);
        resetUrl.searchParams.set('email', lowerEmail);
        resetUrl.searchParams.set('token', token);
        resetUrl.searchParams.set('resetId', resetId);

        try {
          await sendPasswordResetEmail(fastify.env, {
            to: lowerEmail,
            resetLink: resetUrl.toString(),
            expiresAt,
          });
        } catch (error) {
          fastify.log.error(error, 'Failed to send password reset email');
          throw fastify.httpErrors.internalServerError(
            'Failed to send password reset email. Please try again later.'
          );
        }

        await client.query('COMMIT');

        return { message: genericMessage };
      } catch (error) {
        await client.query('ROLLBACK');
        if (error.statusCode) {
          throw error;
        }
        fastify.log.error(error, 'Error during forgot password request');
        throw fastify.httpErrors.internalServerError('Unable to process password reset request.');
      } finally {
        client.release();
      }
    }
  );

  fastify.post(
    '/auth/reset-password',
    { schema: resetPasswordSchema },
    async (request) => {
      const { email, token, resetId, password } = request.body;
      const lowerEmail = email.toLowerCase();
      const client = await fastify.pg.connect();

      try {
        await client.query('BEGIN');

        const verification = await consumePasswordResetRecord(client, {
          email: lowerEmail,
          token,
          resetId,
        });

        if (!verification.ok) {
          switch (verification.reason) {
            case 'expired':
              throw fastify.httpErrors.badRequest('Reset link has expired. Please request a new one.');
            case 'invalid':
            case 'not_found':
              throw fastify.httpErrors.badRequest('Invalid reset link. Please request a new one.');
            case 'consumed':
              throw fastify.httpErrors.badRequest('Reset link already used. Please request a new one.');
            default:
              throw fastify.httpErrors.badRequest('Password reset failed. Please request a new link.');
          }
        }

        const newPasswordHash = await hashPassword(password);

        await client.query(
          `UPDATE users
             SET password_hash = $1,
                 updated_at = NOW()
           WHERE id = $2`,
          [newPasswordHash, verification.userId]
        );

        await client.query('COMMIT');

        return {
          message: 'Password reset successfully. You can now sign in with your new password.',
        };
      } catch (error) {
        await client.query('ROLLBACK');
        if (error.statusCode) {
          throw error;
        }
        fastify.log.error(error, 'Failed to reset password');
        throw fastify.httpErrors.internalServerError('Unable to reset password.');
      } finally {
        client.release();
      }
    }
  );

  fastify.get(
    '/auth/me',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const userId = request.user.sub;
      const { rows } = await fastify.pg.query(
        `SELECT id, full_name, email, phone, referral_code, referred_by, points, is_verified
         FROM users WHERE id = $1`,
        [userId]
      );

      if (!rows.length) {
        throw fastify.httpErrors.notFound('User not found');
      }

      return {
        user: mapUserRow(rows[0]),
      };
    }
  );

  fastify.get(
    '/auth/referrals',
    { preHandler: [fastify.authenticate], schema: referralsQuerySchema },
    async (request) => {
      const userId = request.user.sub;
      const { page = 1, pageSize = 10 } = request.query;
      const limit = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
      const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

      const totalRes = await fastify.pg.query(
        `SELECT COUNT(*)::int AS total
         FROM users
         WHERE referred_by = $1`,
        [userId]
      );

      const { rows: userRows } = await fastify.pg.query(
        `SELECT points, referral_code
         FROM users
         WHERE id = $1`,
        [userId]
      );

      const currentPoints = Number(userRows[0]?.points ?? 0);
      const referralCode = userRows[0]?.referral_code ?? null;

      const { rows } = await fastify.pg.query(
        `SELECT email, created_at, is_verified
         FROM users
         WHERE referred_by = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return {
        total: totalRes.rows[0]?.total ?? 0,
        page: Math.max(Number(page) || 1, 1),
        pageSize: limit,
        hasMore: offset + rows.length < (totalRes.rows[0]?.total ?? 0),
        points: currentPoints,
        referralCode,
        referrals: rows.map((row) => ({
          email: maskEmailAddress(row.email),
          createdAt: row.created_at,
          isVerified: row.is_verified,
        })),
      };
    }
  );
}


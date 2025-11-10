import { hashPassword } from '../utils/password.js';
import { generateReferralCode } from '../utils/referral.js';
import { createOtpRecord } from '../services/otp.js';
import { sendOtpEmail } from '../services/mailer.js';

const waitlistBodySchema = {
  type: 'object',
  required: ['fullname', 'email', 'phone', 'password'],
  additionalProperties: false,
  properties: {
    fullname: { type: 'string', minLength: 2, maxLength: 120 },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string', minLength: 6, maxLength: 20 },
    password: { type: 'string', minLength: 8, maxLength: 128 },
    referredBy: { type: 'string', nullable: true },
  },
};

export default async function waitlistRoutes(fastify) {
  fastify.post(
    '/waitlist',
    {
      schema: {
        body: waitlistBodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              verificationId: { type: 'string' },
              debugOtp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { fullname, email, phone, password, referredBy } = request.body;
      const lowerEmail = email.toLowerCase();
      const client = await fastify.pg.connect();

      try {
        await client.query('BEGIN');

        const { rows: existing } = await client.query(
          `SELECT id, is_verified, password_hash, referral_code
           FROM users
           WHERE email = $1
           FOR UPDATE`,
          [lowerEmail]
        );

        let userId;
        let referralCode = existing[0]?.referral_code;
        let passwordHash = existing[0]?.password_hash;

        const existingUser = existing[0];

        if (existingUser?.is_verified) {
          await client.query('COMMIT');
          return {
            message: 'Account already verified. Please sign in.',
            alreadyVerified: true,
          };
        }

        if (!existing.length) {
          passwordHash = await hashPassword(password);
          referralCode = generateReferralCode(fullname);

          let referredById = null;
          if (referredBy) {
            const refRes = await client.query(
              'SELECT id FROM users WHERE referral_code = $1',
              [referredBy]
            );
            referredById = refRes.rows[0]?.id ?? null;
          }

          const insertUser = await client.query(
            `INSERT INTO users (full_name, email, phone, password_hash, referral_code, referred_by, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, false)
             RETURNING id`,
            [fullname, lowerEmail, phone, passwordHash, referralCode, referredById]
          );
          userId = insertUser.rows[0].id;
        } else {
          userId = existing[0].id;
          const newHash = await hashPassword(password);
          passwordHash = newHash;

          let referredById = null;
          if (referredBy) {
            const refRes = await client.query(
              'SELECT id FROM users WHERE referral_code = $1',
              [referredBy]
            );
            referredById = refRes.rows[0]?.id ?? null;
          }

          if (!referralCode) {
            referralCode = generateReferralCode(fullname);
          }

          await client.query(
            `UPDATE users
             SET full_name = $1,
                 phone = $2,
                 password_hash = $3,
                 referral_code = $4,
                 referred_by = COALESCE($5, referred_by),
                 updated_at = NOW()
             WHERE id = $6`,
            [fullname, phone, passwordHash, referralCode, referredById, userId]
          );
        }

        await client.query(
          `INSERT INTO waitlist_entries (user_id, status)
           VALUES ($1, 'pending')
           ON CONFLICT (user_id) DO UPDATE
           SET status = EXCLUDED.status,
               updated_at = NOW()`,
          [userId]
        );

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
          fastify.log.error(error, 'Failed to send OTP email');
          throw fastify.httpErrors.internalServerError(
            'Failed to deliver OTP email. Please try again shortly.'
          );
        }

        await client.query('COMMIT');

        const responsePayload = {
          message: 'Waitlist submission received. Please verify the OTP sent to your email.',
          verificationId,
          expiresAt,
        };

        if (fastify.env.nodeEnv !== 'production') {
          responsePayload.debugOtp = otp;
        }

        return responsePayload;
      } catch (error) {
        await client.query('ROLLBACK');
        fastify.log.error(error, 'Failed to process waitlist registration');
        throw fastify.httpErrors.internalServerError('Unable to process waitlist registration');
      } finally {
        client.release();
      }
    }
  );
}


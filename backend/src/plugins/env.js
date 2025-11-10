import dotenv from 'dotenv';

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_ORIGIN',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM_NAME',
];

export function loadEnv() {
  dotenv.config();

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || '10'),
    passwordResetExpiryMinutes: Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES || '60'),
    frontendOrigin: process.env.FRONTEND_ORIGIN,
    nodeEnv: process.env.NODE_ENV || 'development',
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      fromName: process.env.SMTP_FROM_NAME,
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    },
  };
}


import nodemailer from 'nodemailer';

let transporter;

export function createTransporter(env) {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.password,
    },
  });

  return transporter;
}

export async function sendOtpEmail(env, { to, otp, expiresAt }) {
  const mailer = createTransporter(env);
  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'soon';

  const from = `"${env.smtp.fromName}" <${env.smtp.fromEmail}>`;

  const subject = 'Your Tokicard early access verification code';
  const text = [
    `Hi there,`,
    '',
    `Your Tokicard early access verification code is: ${otp}`,
    '',
    `This code expires around ${formattedExpiry}.`,
    '',
    `If you didn't request this code, please ignore this email.`,
    '',
    `— The Tokicard team`,
  ].join('\n');

  const html = `
    <div style="font-family: Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p style="margin: 0 0 12px;">Hi there,</p>
      <p style="margin: 0 0 12px;">Your Tokicard early access verification code is:</p>
      <p style="
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 8px;
        background: #111827;
        color: #ffffff;
        padding: 12px 16px;
        text-align: center;
        border-radius: 12px;
        display: inline-block;
        margin: 0 0 16px;
      ">
        ${otp}
      </p>
      <p style="margin: 0 0 12px;">This code expires around <strong>${formattedExpiry}</strong>.</p>
      <p style="margin: 0 0 12px;">If you didn't request this code, please ignore this email.</p>
      <p style="margin: 24px 0 0;">— The Tokicard team</p>
    </div>
  `;

  await mailer.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail(env, { to, resetLink, expiresAt }) {
  const mailer = createTransporter(env);
  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'soon';

  const from = `"${env.smtp.fromName}" <${env.smtp.fromEmail}>`;

  const subject = 'Reset your Tokicard password';
  const text = [
    'Hi there,',
    '',
    'We received a request to reset the password for your Tokicard account.',
    'You can set a new password by visiting the link below:',
    resetLink,
    '',
    `This link expires around ${formattedExpiry}.`,
    '',
    'If you didn’t request this, you can safely ignore this email.',
    '',
    '— The Tokicard team',
  ].join('\n');

  const html = `
    <div style="font-family: Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p style="margin: 0 0 12px;">Hi there,</p>
      <p style="margin: 0 0 12px;">We received a request to reset the password for your Tokicard account.</p>
      <p style="margin: 0 0 16px;">
        <a href="${resetLink}" style="
          display: inline-block;
          background: #111827;
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
        ">
          Reset your password
        </a>
      </p>
      <p style="margin: 0 0 12px;">This link expires around <strong>${formattedExpiry}</strong>.</p>
      <p style="margin: 0 0 12px;">If you didn’t request this, you can safely ignore this email.</p>
      <p style="margin: 24px 0 0;">— The Tokicard team</p>
    </div>
  `;

  await mailer.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}


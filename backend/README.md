# Tokicard Backend API

Fastify-based REST API for Tokicard waitlist, authentication, OTP verification, and quest tracking.  
Technologies used:

- Fastify 5.x
- PostgreSQL via `pg`
- JSON Web Tokens with `@fastify/jwt`
- Bcrypt for password hashing
- Nodemon for local development

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or managed service such as Neon/Supabase)

### Install dependencies

```bash
cd backend
npm install
```

### Environment variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `OTP_EXPIRY_MINUTES` | Minutes before OTP expires (default 10) |
| `FRONTEND_ORIGIN` | Allowed CORS origin (e.g., `http://localhost:3000`) |
| `SMTP_HOST`, `SMTP_PORT` | SMTP server (e.g., `smtp.gmail.com`, `587`) |
| `SMTP_USER`, `SMTP_PASSWORD` | Gmail address & app password |
| `SMTP_FROM_NAME` | Friendly sender name |
| `SMTP_FROM_EMAIL` | (Optional) From email if different from user |

### Database setup

Run the SQL schema to create required tables:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

This creates:

- `users` – accounts & waitlist metadata  
- `waitlist_entries` – waitlist status per user  
- `otp_codes` – temporary OTP storage  
- `quests` – quest catalog (auto-seeded on boot)  
- `user_quests` – quest completion tracking

### Development server

```bash
npm run dev
```

Server listens on `http://localhost:4000` by default.

## API Overview

### Waitlist & OTP

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/waitlist` | Register for waitlist, create OTP |
| `POST` | `/api/verify-otp` | Validate OTP, mark user verified, return JWT |
| `POST` | `/api/resend-otp` | Regenerate OTP |

Waitlist payload:

```json
{
  "fullname": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+2348012345678",
  "password": "strong-password",
  "referredBy": "friend-code" // optional
}
```

> In non-production environments the OTP is returned in the response (`debugOtp`) to make manual testing easy.

### Authentication

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/auth/login` | Email/password login (requires verified account) |
| `GET`  | `/api/auth/me` | Retrieve current user profile (requires bearer token) |

Authorization: send `Authorization: Bearer <token>` header.

### Quests

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET`  | `/api/quests` | List quests with completion state (auth required) |
| `POST` | `/api/quests/:slug/complete` | Mark quest complete & award points |

Quests are seeded automatically with the following slugs:

- `follow-x`
- `follow-instagram`
- `join-telegram`
- `refer-friend`

## Points & Referrals

- Points are stored on the `users.points` column (integer).  
- Each quest awards its configured points once; subsequent completions are ignored.  
- Referral codes are generated from the user’s name plus a random suffix: e.g., `jane-abc123`.  
- The dashboard displays user points as dollars using a `100 pts = $1` conversion.

## Folder Structure

```
backend/
  db/
    schema.sql
  src/
    plugins/
      db.js        # Postgres connection
      env.js       # dotenv loader & validation
    routes/
      auth.js
      quests.js
      waitlist.js
    services/
      otp.js
    utils/
      password.js
      referral.js
    server.js
  .env.example
  package.json
```

## Next Steps

- For Gmail SMTP: enable 2FA on the sender account and generate an App Password (Account → Security → App passwords); copy it into `SMTP_PASSWORD`.
- For production-ready Gmail API OAuth, create OAuth credentials in Google Cloud Console and swap the mailer implementation accordingly.
- Configure an email or SMS provider to deliver OTP codes.
- Add rate-limiting (`@fastify/rate-limit`) to protect endpoints.
- Wire analytics or logging sinks (Datadog, Logflare, etc.).
- Containerize with Docker if desired.
- Add integration tests using `tap` or `vitest`.
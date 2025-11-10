# Tokicard - Waitlist & Referral System

Full-stack waitlist system with referral tracking and quest-based points.

## Quick Start

**Backend:**
```bash
cd backend && npm install
cp .env.example .env  # Configure your variables
npm run dev  # Runs on http://localhost:4000
```

**Frontend:**
```bash
cd frontend && npm install
cp .env.example .env  # Set VITE_API_URL
npm run dev  # Runs on http://localhost:3000
```

## Tech Stack

- Frontend: Vanilla JavaScript + Vite
- Backend: Fastify + PostgreSQL
- Auth: JWT + bcrypt
- Email: Nodemailer (Gmail SMTP)

See `frontend/README.md` and `backend/README.md` for detailed docs.

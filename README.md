# UniBook

University of Ghana lecturer appointment booking - Next.js, Neon Postgres, Auth.js (email/password), Vercel.

See [`plan.md`](./plan.md) and [`design.md`](./design.md).

## Setup

1. Copy env: `cp .env.example .env.local` and fill values.
2. Install: `npm install`
3. Push schema: `npm run db:push`
4. Dev server: `npm run dev` → http://localhost:3000

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | Auth.js session secret (`openssl rand -base64 32`) |
| `AUTH_URL` / `NEXT_PUBLIC_APP_URL` | App URL (localhost in dev; Vercel URL in production) |
| `LECTURER_EMAILS` | Comma-separated emails that register as lecturers |
| `ADMIN_EMAILS` | Comma-separated emails that register as admins |
| `RESEND_API_KEY` | **Not required for MVP** - Resend notifications are technical debt |
| `EMAIL_FROM` | Only needed when Resend is wired later |

## Technical debt

- **Appointment emails (FR-07 / Resend):** Accept, decline, and cancel update status in the app only. Email notify via Resend is deferred; leave `RESEND_API_KEY` empty for now.

## Demo logins (for testing)

Run `npm run db:seed` anytime to reset these accounts. Password for all: **`password123`**

| Role | Email |
|------|-------|
| Student | `student@test.com` |
| Lecturer | `lecturer@test.com` (seeded as accepting appointments) |
| Admin | `admin@test.com` |

## Demo roles (custom emails)

1. Put a lecturer email in `LECTURER_EMAILS`.
2. Register that email → lecturer dashboard.
3. Register any other email as a student → browse and request slots.
4. Toggle lecturer to **Accepting appointments**, then book as student.

## Deploy (Vercel)

1. Push repo to GitHub and import on Vercel.
2. Set the same env vars in the Vercel project.
3. Set `AUTH_URL` / `NEXT_PUBLIC_APP_URL` to the production URL.
4. Redeploy after env changes.

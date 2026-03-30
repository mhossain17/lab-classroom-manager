# AI Classroom Manager - Labs

A local-first classroom web app for lab-based high school engineering courses.

## What this app solves

- Reduces repeated teacher explanations with a strong `Start Here` hub
- Helps students independently identify the next step in a lab
- Guides troubleshooting with AI (or fallback rules)
- Flags when teacher intervention is needed
- Gives a live teacher dashboard for bottlenecks and stuck students

## Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (local development) + Turso (hosted libSQL)

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env
```

3. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4. Seed sample data:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo control center

- Open `/demo` for one-click role switching (seeded users), live app snapshot, and a guided smoke-test checklist.
- Repeatable test script: `DEMO_PLAYBOOK.md`.

## Demo identities (seeded)

- Teacher: `teacher_rivera`
- Admin: `admin_lab`
- Students: `avery`, `jordan`, `nina`, `ethan`, `mia`, `leo`

Login is intentionally simple in MVP: choose identity from the login dropdown.

## Environment variables

See `.env.example`.

- `DATABASE_URL`: local SQLite DB path used by Prisma CLI/migrations
- `TURSO_DATABASE_URL`: Turso database URL (for deployed/runtime usage)
- `TURSO_AUTH_TOKEN`: Turso auth token
- `OPENAI_API_KEY`: optional, enables AI responses
- `OPENAI_MODEL`: optional model override (default `gpt-4.1-mini`)
- `APP_URL`: local app URL

If no API key is present, the app uses rule-based fallback troubleshooting.

## Vercel + Turso deployment

1. In Turso, create your database and auth token.
2. Initialize schema on Turso (choose one):
   - Import your existing local DB:

   ```bash
   turso db import ./dev.db --name <your-db-name>
   ```

   - Or apply your Prisma migration SQL files with Turso CLI:

   ```bash
   turso db shell <your-db-name> < prisma/migrations/<timestamp>_<name>/migration.sql
   ```

3. In Vercel project settings, add:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Redeploy.

Runtime Prisma client logic automatically uses Turso when `TURSO_DATABASE_URL` is set, and falls back to local SQLite when it is not.

For seeding Turso directly:

```bash
TURSO_DATABASE_URL="libsql://<your-db-url>" TURSO_AUTH_TOKEN="<your-token>" npm run db:seed
```

## Key features implemented

- Role-aware access flow (Student / Teacher)
- Student dashboard with active classes and labs
- Lab `Start Here` instruction hub
- Step-by-step lab workflow with expected results and common problems
- AI troubleshooting page with guided follow-up logic
- AI lab packet builder for teachers (standards alignment, due date, packet sections, report guidance, rubric)
- Personalized progress tracking (`not started`, `in progress`, `stuck`, `waiting`, `completed`)
- Student lab report workspace with in-procedure thinking log, schematic text capture, and downloadable markdown export
- Teacher dashboard with:
  - students by status
  - current step distribution
  - needs-teacher-now queue
  - common bottlenecks
  - recent activity
  - alert stream
- Class management + enrollment by student username
- CSV student import by class (headers: student ID, first name, last name, e-mail)
- Admin user management page (`/teacher/users`) for account creation and bulk student import
- Lab builder (objective, materials, instructions, multi-step editor)
- Branding/theme settings (school name, logo URL, color palette, presets, preview)
- Branding/theme settings (school name, logo upload to `public/uploads`, color palette, presets, preview)
- App settings (AI + fallback + alert thresholds)

## AI service layer

- `lib/ai/assistant.ts`: OpenAI integration and JSON parsing
- `lib/ai/fallback.ts`: deterministic troubleshooting fallback
- UI does not directly call OpenAI; all logic goes through server actions

## Prisma models

Core models include:

- `User`
- `Class`
- `Enrollment`
- `Lab`
- `LabStep`
- `TroubleshootingCheckpoint`
- `StudentLabProgress`
- `HelpRequest`
- `TeacherAlert`
- `ThemeSettings`
- `SchoolSettings`
- `ActivityLog`

Schema file: `prisma/schema.prisma`.

## Project structure (high level)

- `app/` pages and routes (student + teacher)
- `components/` reusable UI and feature components
- `lib/` Prisma client, auth/session helper, data queries, AI layer, alert logic, server actions
- `prisma/` schema and seed script
- `public/` branding assets

## Notes for production hardening

- Replace demo identity selector with proper auth (NextAuth/Auth.js or SSO)
- Add optimistic UI and websocket/poll updates for near real-time dashboard refresh
- Add file upload API for school logo storage
- Add richer analytics charts and intervention history
- Add multi-teacher tenancy constraints and permission boundaries

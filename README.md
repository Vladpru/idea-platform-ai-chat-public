# idea-platform-team-2

Fullstack internship project (Team 2): idea & problem sharing platform built with React and NestJS.

## Tech Stack

- **Frontend:** React, Vite, TanStack Router
- **Backend:** NestJS, Prisma v7
- **Database:** Neon (PostgreSQL)
- **Hosting:** Render

---

## Local Development

### Prerequisites

- Node.js 22+ (use `nvm use 22`)
- Yarn

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/oril-software/idea-platform-team-2
   cd idea-platform-team-2
   ```

2. **Install dependencies**

   ```bash
   cd backend && yarn install
   cd ../frontend && yarn install
   ```

3. **Environment files** — create from examples:

   ```bash
   cp backend/.env.example backend/.env.development
   cp frontend/.env.example frontend/.env.development
   ```

   Fill in `DATABASE_URL` in `backend/.env.development` with the Neon development branch URL.
   For transactional email (welcome + password reset), set `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` (a verified sender in SendGrid).

4. **Generate Prisma client**

   ```bash
   cd backend && yarn prisma generate
   ```

5. **Run locally**

   ```bash
   # Terminal 1 — backend
   cd backend && yarn start:dev

   # Terminal 2 — frontend
   cd frontend && yarn dev
   ```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/docs

---

## Branch Strategy & Auto-Deploy

| Branch    | Environment | Auto-deploys to                             |
| --------- | ----------- | ------------------------------------------- |
| `develop` | Development | `idea-platform-team-2-develop.onrender.com` |
| `staging` | Staging     | `idea-platform-team-2-staging.onrender.com` |
| `main`    | Production  | _(not yet configured)_                      |

**Every push to `develop` or `staging` triggers an automatic deploy on Render.**

### Workflow

```
feature branch → PR → develop → PR → staging → PR → main
```

1. Create a feature branch from `develop`
2. Open a PR into `develop` — auto-deploys on merge
3. When ready for QA, open a PR from `develop` → `staging`
4. When approved, open a PR from `staging` → `main` (production)

---

## Database (Neon)

Three isolated Neon branches — one per environment:

| Environment | Neon Branch         |
| ----------- | ------------------- |
| development | `development`       |
| staging     | `staging`           |
| production  | `production` (main) |

### Running migrations locally

```bash
cd backend

# development
yarn prisma migrate dev --name <migration-name>

# staging
DATABASE_URL=<staging-url> yarn prisma migrate deploy

# production
DATABASE_URL=<production-url> yarn prisma migrate deploy
```

Migrations run **automatically on every deploy** via the start command on Render.

---

## Environment Variables

| File                        | Used for            |
| --------------------------- | ------------------- |
| `backend/.env.development`  | Local backend       |
| `backend/.env.staging`      | Staging backend     |
| `backend/.env.production`   | Production backend  |
| `frontend/.env.development` | Local frontend      |
| `frontend/.env.staging`     | Staging frontend    |
| `frontend/.env.production`  | Production frontend |

> `.env.*` files are gitignored. Never commit secrets. Ask a teammate for values if needed.

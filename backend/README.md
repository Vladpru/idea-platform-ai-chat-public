# Backend (NestJS)

Use **Yarn** for installs and scripts in this repo (`yarn install`, `yarn start:dev`, …), not npm.

## Prerequisites

- **Node.js** (LTS recommended)
- **Yarn** (install globally or use [Corepack](https://nodejs.org/download/release/latest/docs/api/corepack.html): `corepack enable`)
- **PostgreSQL** 16+ (local install or Docker)

## 1. Install dependencies

From this directory (`backend/`):

```bash
yarn install
```

## 2. Environment variables

Copy the example file and edit values:

```bash
cp .env.example .env
```

## 3. Database

### Docker Compose (Postgres + Redis)

```bash
docker compose up -d
```

Default services from `docker-compose.yml`:

- **Postgres** — user `postgres`, password `postgres`, database `oril-app`, port `5432`. Point `DATABASE_URL` at that instance.
- **Redis** — port `6379`. Set `REDIS_URL=redis://localhost:6379` in `.env` for local Socket.IO scaling tests.

### Apply schema (migrations)

```bash
yarn prisma generate
yarn prisma migrate deploy
```

For a fresh local database with no migration history yet, you can use `yarn prisma migrate dev` instead of `deploy` during development.

## 4. Run the API

**Development (watch mode):**

```bash
yarn start:dev
```

**Production build:**

```bash
yarn build
yarn start:prod
```

The server listens on `http://localhost:<APP_PORT>`.

## 5. API docs

Open **Swagger UI** in a browser:

`http://localhost:<APP_PORT>/docs`

## Local avatars

Uploaded avatars are written to `storage/avatars/` (ignored by git except `.gitkeep`) and served at `/files/avatars/<filename>`. Ensure `APP_PUBLIC_URL` matches how clients reach the API if it is not `localhost`.

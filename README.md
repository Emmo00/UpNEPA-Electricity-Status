# UpNEPA

UpNEPA is a mobile-first, crowdsourced electricity-status app for Nigeria. It helps people see the latest power situation in their area and contribute anonymous reports.

## Features

- View derived electricity status by Nigerian distribution zone: **ON**, **OFF**, **MIXED**, **STALE**, or **NONE**
- Submit anonymous power-status reports from a confirmed location
- Confirm location automatically or choose a nearby zone with a draggable map pin
- Browse and search zones, with in-place refresh for current updates
- Review reporting history and confirmed location details in the profile
- Rate-limited API with seeded Nigerian zones

## Local development

This is a pnpm workspace. Install dependencies, then run the web app and API server in separate terminals:

```bash
pnpm install
pnpm --filter @workspace/upnepa run dev
pnpm --filter @workspace/api-server run dev
```

Useful commands:

```bash
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push
```

The API and database require a PostgreSQL `DATABASE_URL`. Keep development database schema changes local and review them before applying elsewhere.

## Stack

- React, TypeScript, Vite, Tailwind CSS, and Radix UI
- Express 5 API
- PostgreSQL with Drizzle ORM
- Zod validation and Orval-generated API hooks
- pnpm workspaces

## Project structure

```text
artifacts/upnepa/       React/Vite web app
artifacts/api-server/   Express API and zone/reporting routes
lib/db/                 Drizzle database connection and schema
lib/api-spec/           OpenAPI source and Orval code generation
lib/api-zod/            Shared Zod schemas
lib/api-client-react/   Generated React API client
```
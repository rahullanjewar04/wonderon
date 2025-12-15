Book Management — README

Overview
This repository powers a small Book Management backend API written in TypeScript using Express and Prisma. It includes request-scoped logging, audit logging via Prisma extensions, Zod schemas for validation, and a small set of services/repositories/controllers.

Quick links
- Server entry: [`src/server.ts`](src/server.ts)
- Prisma wrapper and audit wiring: [`src/utils/prisma/index.ts`](src/utils/prisma/index.ts)
- Audit service: [`src/services/audit-log.ts`](src/services/audit-log.ts)
- Audit router: [`src/api/v1/routes/audit-log.ts`](src/api/v1/routes/audit-log.ts)
- Audit controller: [`src/api/v1/controllers/audit-log.ts`](src/api/v1/controllers/audit-log.ts)
- Prisma schema: [`prisma/schema.prisma`](prisma/schema.prisma)
- Project manifest: [`package.json`](package.json)
- TypeScript config: [`tsconfig.json`](tsconfig.json)
- Production-readiness notes: [`plans/production-readiness-2.md`](plans/production-readiness-2.md)

Prerequisites
- Node.js (recommended v18+)
- npm (or an alternative package manager)
- Git
- Docker (optional, for containerized runs)

Environment
- Copy and edit environment variables from the example file:
  - `.env` (create from) [`.env.example`](.env.example)
- Important config is read through the central config utility. Ensure values for DB (dbUrl), JWT secret, encryption key, logger transports, and Redis are provided for the environment you run in.
  - `.config.json` (create from) [`.config.example.json`](config.example.json)

Local development — quick start
1. Install dependencies:
   - `npm install`
2. Generate Prisma client (keeps generated client in sync):
   - `npx prisma generate`
3. Run migrations (creates/updates local DB schema):
   - `npx prisma migrate deploy`
   - OR for development (creates a new migration):
     - `npx prisma migrate dev --name init`
   Note: The project uses SQLite by default in the schema. If you change the DB provider, update config accordingly.
4. Start the docker dependencies (optional)
   - `docker compose up -d`
5. Start the server in development:
   - `npm run dev`
6. Health check:
   - GET http://localhost:<PORT>/health
   - Default port is defined in your app config (see [`config.json`](config.json) startup logs).

Prisma commands you will likely use
- Generate client:
  - `npx prisma generate`
- Create a new migration (dev):
  - `npx prisma migrate dev --name <description>`
- Apply migrations (CI / production):
  - `npx prisma migrate deploy`
- Open Prisma Studio to inspect DB:
  - `npx prisma studio`
- If you need to reset the local DB (dangerous, destructive):
  - `npx prisma migrate reset`

Project structure (high level)
- src/
  - server.ts — application entry and startup wiring (`[`src/server.ts`](src/server.ts)`)
  - api/
    - router.ts — API-level router (`[`src/api/router.ts`](src/api/router.ts)`)
    - v1/
      - routes/ — route factories (register routers)
        - [`src/api/v1/routes/audit-log.ts`](src/api/v1/routes/audit-log.ts)
      - controllers/ — controller classes that handle requests
        - [`src/api/v1/controllers/audit-log.ts`](src/api/v1/controllers/audit-log.ts)
      - middlewares/ — route-specific middleware (auth, admin, etc.)
  - services/ — business logic / service layer
    - [`src/services/audit-log.ts`](src/services/audit-log.ts)
  - repositories/ — DB access, one-per-model
    - [`src/repositories/audit-log.ts`](src/repositories/audit-log.ts)
  - utils/
    - prisma/ — prisma client wrapper and generated client (`[`src/utils/prisma/index.ts`](src/utils/prisma/index.ts)`, [`prisma/schema.prisma`](prisma/schema.prisma))
    - logger/ — logger wrapper and transports
    - async-local-storage/ — request context helpers
    - audit/ — audit configuration
  - schema/ — Zod schemas for request/response validation
- prisma/ — Prisma schema and migrations (`[`prisma/schema.prisma`](prisma/schema.prisma)`)

How routing and wiring generally works
- Server startup (`[`src/server.ts`](src/server.ts)`) initializes config, logger, and the Prisma wrapper.
- The API router is mounted at /api; v1 routes created under [`src/api/v1/routes/router.ts`](src/api/v1/routes/router.ts).
- Route factories currently create repository/service/controller instances. For singletons or shared instances, wiring should be centralized in startup (we recommend moving instantiation to a single initializer).

Logging and request context
- The app uses pino for structured logs through a `Logger` singleton (`[`src/utils/logger/index.ts`](src/utils/logger/index.ts)`).
- Request context (requestId, ip, etc.) is captured using async local storage middleware — this gives you per-request child loggers and consistent requestId in logs.

Audit logging notes
- Audit logs are implemented in a service (`[`src/services/audit-log.ts`](src/services/audit-log.ts)`) and Prisma client is extended to call audit hooks on create/update/delete.
- Be careful with initialization ordering: the audit service must be created before the Prisma extensions that reference it are attached — otherwise hooks may reference an uninitialized service.

Testing
- There are no tests currently in package.json. Recommended next steps:
  - Add unit tests for services and repositories (Jest/Vitest).
  - Add integration tests that run against a disposable DB (sqlite in-memory or a dedicated dockerized DB).

Common operations
- Build for production:
  - npm run build
- Run production bundle after build:
  - npm start
- Linting: configured via eslint; run eslint as needed.

Security and production recommendations (short)
- Use a secrets manager for JWT/encryption keys in production.
- Add rate limiting (there is a placeholder rate-limit middleware used in startup).
- Add monitoring (metrics + traces) and an error aggregation tool.


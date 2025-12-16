# Book Publishing API

Overview
--------
A minimal Book Publishing API (TypeScript + Node.js) focused on observability and a config-driven audit trail. This README explains how to run the project locally, why the chosen database was used, how to switch logging sinks, the audit configuration, example cURL flows, and a brief codebase evaluation against the assignment criteria.

Quick links to important files
- Audit service: [`src/services/audit-log.ts`](src/services/audit-log.ts)
- Audit repository: [`src/repositories/audit-log.ts`](src/repositories/audit-log.ts)
- Request context (AsyncLocalStorage): [`src/api/common/middlewares/request-context.ts`](src/api/common/middlewares/request-context.ts)
- Logger factory: [`src/utils/logger/index.ts`](src/utils/logger/index.ts)
- Seed script (users + sample books): [`src/migrations/seed.ts`](src/migrations/seed.ts)
- Prisma schema / DB config: [`prisma/schema.prisma`](prisma/schema.prisma)

Requirements
------------
- Node.js >= 20
- npm (or yarn)
- (Optional) Docker if you prefer running a different DB than the default


Rationale (made it simple due to time constraints)
----------------------
1. DB Choice
This repo includes Prisma and a `prisma/` folder; chosen SQLite for local
ease-of-use (single-file DB, zero ops). SQLite is ideal for a demo: quick migrations, repeatable seeds, and no external dependencies. See [`prisma/schema.prisma`](prisma/schema.prisma).

2. Soft delete vs hard delete
Kept it as soft delete for recovery, can be permanently deleted using cron after set time if no recovery is made. Also helps in audit logging.

3. Pino is setup for json logging to sdtout, and also can be extended to other ingest sources by configuring [config](config.json). Audit logs are in place, uses async local storage and adds required data in db.

4. Kept auth and rbac simple, rbac can be made hierarchial in production use cases. Maybe we can use casbin/permify for rbac. Auth needs to be more secure, need to use accessToken + refreshToken with statefullness for server control

5. Overall setup uses singleton and dependency injection patterns, it can be modified more to be more scalable.

6. Using zod for input validation, have separate client and server schemas so both can be validated individually.

7. Kept it simple due to time constraint.

Setup (local)
-------------
1. Install dependencies
```bash
npm install
```

1. Copy env example and edit if desired [example env](.env.example)
```bash
cp .env.example .env
# Edit .env if you want to change log transports or DB URL
```

1. Copy config example and edit if desired [example config](config.example.json)
```bash
cp config.example.json config.json
# Edit .env if you want to change log transports or DB URL
```
1. Start the docker compose (uses redis for rate limiting, could have been simpler with in memory counter)
```bash
docker compose up -d
```

1. Run migrations and seed the DB
```bash
npx prisma
npx prisma migrate dev --name init
npm run dev:migrate
```

1. Start the dev server
```bash
npm run dev
```

1. Launch Prisma studio for verifying data in database.
```bash
npx prisma studio
```

Auth & seeds
-----------
A small seed creates two users (admin & reviewer) and a few books. See [`src/migrations/seed.ts`](src/migrations/seed.ts). Authentication uses JWT via [`src/api/v1/middlewares/auth.ts`](src/api/v1/middlewares/auth.ts) (expects `Authorization: Bearer <token>`). The seed script prints (or stores) the sample tokens / API keys—look at the seed script output.

Switching log sinks
-------------------
Logging is centralized in the `Logger` class: [`src/utils/logger/index.ts`](src/utils/logger/index.ts). The logger reads configuration (see `config.example.json` / `.env`) and builds transports. Supported transports:
- file (`file`) — local file transport (default)
- logtail (`logtail`) — pino transport code path is present [logtail](src/utils/logger/transports/logtail.ts)
- elasticsearch (`elasticsearch`) — code path present [elasticsearch](src/utils/logger/transports/elastic-search.ts)

To change transports:
1. Edit your config (env or `config.json`) and set `log.transports` to the desired array.
2. Restart the server. The `Logger.getInstance()` picks transports at startup.

Audit configuration
-------------------
Audit behavior is configuration-driven. The project centralizes audit rules so adding a new entity is a config change + optional hook registration. See the audit config and sanitizer behavior in [`src/utils/audit.ts`](src/utils/audit.ts) and the service in [`src/services/audit-log.ts`](src/services/audit-log.ts). Typical config looks like:

[`typescript()`](src/utils/audit.ts)
```ts
export const auditConfig = {
  book: { track: true, exclude: ['updatedAt'], redact: [] },
  user: { track: true, exclude: ['credentials'], redact: ['credentials'] },
} as const;
```

What an audit record contains
- id, timestamp, entity, entityId, action (CREATE|UPDATE|DELETE), actorId, requestId, ip, diff (respecting exclude/redact)

API Endpoints (high-level)
--------------------------
- Books
  - GET /api/books?limit=&cursor= — paginated list
  - POST /api/books — create (createdBy set from auth)
  - GET /api/books/:id
  - PATCH /api/books/:id
  - DELETE /api/books/:id
- Audits (admin-only)
  - GET /api/audits?...filters...
  - GET /api/audits/:id
See router definitions: [`src/api/v1/routes/router.ts`](src/api/v1/routes/router.ts) and controllers: [`src/api/v1/controllers/book.ts`](src/api/v1/controllers/book.ts), [`src/api/v1/controllers/audit-log.ts`](src/api/v1/controllers/audit-log.ts).

Example Rest Client flows
-----------------
The api can be tested using [rest client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) vscode extension. Check file [rest](rest.http)

Example cURL flows
------------------
1. Login (get fresh token)
```bash
curl -X POST "http://localhost:1337/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@example.com",
    "credentials": "admin123"
  }'
```

2. Get user profile
```bash
curl -X GET "http://localhost:1337/api/v1/me" \
  -H "Authorization: Bearer REPLACE_TOKEN_HERE"
```

3. List books
```bash
curl -X GET "http://localhost:1337/api/v1/books?limit=5" \
  -H "Authorization: Bearer REPLACE_TOKEN_HERE"
```

4. Get book by ID
```bash
curl -X GET "http://localhost:1337/api/v1/books/133f2e32-d3a5-4a74-85aa-31decd8b709d" \
  -H "Authorization: Bearer REPLACE_TOKEN_HERE"
```

5. Create book
```bash
curl -X POST "http://localhost:1337/api/v1/books" \
  -H "Authorization: Bearer REPLACE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "manish",
    "authors": "manish"
  }'
```

6. Update book
```bash
curl -X PATCH "http://localhost:1337/api/v1/books/e2392bcf-c755-4486-affc-7b97917eeb85" \
  -H "Authorization: Bearer REPLACE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "authors": "satish"
  }'
```

7. Delete book
```bash
curl -X DELETE "http://localhost:1337/api/v1/books/e92414d4-2282-4cac-933d-47bd3b1e7ab0" \
  -H "Authorization: Bearer REPLACE_TOKEN_HERE"
```

8. List audits
```bash
curl -X GET "http://localhost:1337/api/v1/audits?limit=25&fieldsChanged=updatedBy" \
  -H "Authorization: Bearer REPLACE_TOKEN_HERE"
```

9. Get audit by ID
```bash
curl -X GET "http://localhost:1337/api/v1/audits/88338282-b9b7-42fd-8837-32700df1a91a" \
  -H "Authorization: Bearer REPLACE_TOKEN_HERE"
```

10. 404 test
```bash
curl -X GET "http://localhost:1337/nonexistent"
```

Developer notes & important internals
------------------------------------
- Request context propagation (requestId, userId, startTime) uses AsyncLocalStorage: [`src/api/common/middlewares/request-context.ts`](src/api/common/middlewares/request-context.ts) and utilities in [`src/utils/async-local-storage.ts`](src/utils/async-local-storage.ts).
- Logger is pino-based with transport builders in [`src/utils/logger/transports/`](src/utils/logger/transports/logtail.ts), [`src/utils/logger/transports/file.ts`](src/utils/logger/transports/file.ts), [`src/utils/logger/transports/elastic-search.ts`](src/utils/logger/transports/elastic-search.ts).
- Audit creation points are in services and repository hooks; see [`src/services/audit-log.ts`](src/services/audit-log.ts).
- Centralized error handling: [`src/api/common/middlewares/error-handler.ts`](src/api/common/middlewares/error-handler.ts).

Additional notes — implemented vs missing
----------------------------------------
Implemented (high level):
- Config-driven audit config [`src/utils/audit.ts`](src/utils/audit.ts:18) with redact/exclude.
- AsyncLocalStorage request context [`src/api/common/middlewares/request-context.ts`](src/api/common/middlewares/request-context.ts:1) and logger integration [`src/utils/logger/index.ts`](src/utils/logger/index.ts:1).
- Pino logger with file transport and code paths for `logtail` and `elasticsearch` in [`src/utils/logger/transports/`](src/utils/logger/transports/logtail.ts:1).

Missing / incomplete due to time constraints:
1. Admin RBAC enforcement on audit routes
   - The audit router [`src/api/v1/routes/audit-log.ts`](src/api/v1/routes/audit-log.ts:1) currently registers GET endpoints but does not apply the admin middleware (`src/api/v1/middlewares/admin.ts`). This allows non-admin users to reach audit endpoints.
2. Robust audit query/filter/pagination implementation
   - The repository [`src/repositories/audit-log.ts`](src/repositories/audit-log.ts:1) builds raw SQL via `$queryRawUnsafe` and contains unquoted string interpolation (risking SQL injection), brittle cursor logic, and limited handling of filters (`fieldsChanged` checking assumes array presence). Replace with Prisma-query-based filters and safe cursor pagination.
3. Consistent entity naming between config and runtime
   - `auditConfig` keys are lowercase (`book`, `user`) but other parts of the codebase and Prisma models may use PascalCase (`Book`, `User`). Add a canonical mapping or normalize keys when evaluating the config.
4. Diff generation and redaction guarantees
   - Ensure the audit service produces a stable diff format (JSON Patch or before/after) and that redact/exclude rules are consistently applied to nested paths. The current code references a `deep-diff` utility but requires tests and edge-case handling (arrays, nulls, nested objects).
5. Input validation & security hardening
   - Few endpoints show explicit validation (zod/class-validator). Add request validation schemas to prevent malformed inputs and avoid logging secrets.
6. Integration tests & unit tests
   - No automated tests included. Add tests covering audit creation for create/update/delete flows, RBAC, and filter behaviors.
7. Soft-delete vs hard-delete policy & justification
   - The assignment requires justifying delete strategy. The README doesn't document whether books are soft-deleted or hard-deleted; implement soft-delete (recommended) or document the chosen approach and ensure audits record deletes.
8. Log sink configuration secrets & examples
   - While code paths exist for Logtail/Elasticsearch sinks, the README lacks exact env variable keys and example config to enable them; add examples and required credentials to `config.example.json`.
9. Exporting / archiving audits & retention
   - No export or retention policies implemented. For production, add an export endpoint or background job and retention rules.
10. CI / Docker run instructions
    - `docker-compose.yaml` exists, but README does not include explicit steps to run the app via Docker / Docker Compose (migrations, seeding, env config). Add a short section.

How to verify critical behaviors locally
-------------------------------------
1. Start the app (dev)
   - npm install && cp .env.example .env && cp config.example.json config.json
   - npm run dev
2. Seed & view users
   - Run the seed: `ts-node src/migrations/seed.ts` or `node ./dist/migrations/seed.js`
   - Note the printed sample admin/reviewer tokens and use them in Authorization header.
3. Create / update / delete a book and confirm an audit record is created
   - Use the example cURL flows above. Then query audits (admin) to confirm the audit event and that redact/exclude rules were applied.

Known issues and next steps
--------------------------
- Replace `$queryRawUnsafe` in `src/repositories/audit-log.ts` with parameterized Prisma queries.
- Normalize audit config keys and improve tests for redaction/exclusion.
- Add validation middleware (zod) to controllers.
- Protect audit endpoints with admin middleware.

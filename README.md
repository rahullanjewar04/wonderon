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

Rationale for DB choice
-----------------------
This repo includes Prisma and a `prisma/` folder; chosen SQLite for local ease-of-use (single-file DB, zero ops). SQLite is ideal for a demo: quick migrations, repeatable seeds, and no external dependencies. See [`prisma/schema.prisma`](prisma/schema.prisma).

Setup (local)
-------------
1. Install dependencies
```bash
npm install
```

2. Copy env example and edit if desired [example env](.env.example)
```bash
cp .env.example .env
# Edit .env if you want to change log transports or DB URL
```

3. Copy config example and edit if desired [example config](config.example.json)
```bash
cp config.example.json config.json
# Edit .env if you want to change log transports or DB URL
```

4. Run migrations and seed the DB
```bash
npx prisma migrate deploy
node ./dist/migrations/seed.js   # or `npm run seed` if a script exists
```
(Alternatively run the TypeScript seed script during development: `ts-node src/migrations/seed.ts`)

5. Start the dev server
```bash
npm run dev
```

6. Launch Prisma studio for verifying data in database.
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

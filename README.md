# FinEdge API

Personal finance tracking REST API — group project.

## Stack
Node.js, Express, `fs/promises` for persistence.

## Getting started
```bash
npm install
cp .env.example .env
npm run dev
```
Server runs on `http://localhost:3000`. Health check: `GET /api/health`.

## Project structure
```
src/
  config/       env-derived configuration
  routes/       Express routers, one file per entity, mounted in routes/index.js
  controllers/  request handlers (thin — delegate to services)
  services/     business logic + repositories (data access)
  models/       data shape references
  middleware/   asyncHandler, error handler, request logger, validation
  utils/        response helpers, custom error classes
data/           JSON files used by the real fs/promises persistence layer
tests/          Jest + Supertest
```

Read [CONTRACT.md](./CONTRACT.md) before writing any controller — it defines
the repository interface, response shape, and error-handling pattern everyone
builds against so no one is blocked on anyone else.

## Team & ownership

| Person | Owns |
|---|---|
| 1 | Project setup, `User` model, `POST /users`, mock JWT session middleware |
| 2 | `Transaction` model, all `/transactions` CRUD endpoints, input validation middleware |
| 3 | Global error handling, custom error classes, request logging, real `fs/promises` persistence layer |
| 4 | `Budget` model, `GET /summary`, in-memory TTL cache, one bonus feature |

## API endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| POST | `/api/users` | Register new user |
| POST | `/api/transactions` | Add income/expense |
| GET | `/api/transactions` | Fetch all transactions |
| GET | `/api/transactions/:id` | View single transaction |
| PATCH | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/summary` | Income/expense summary |

## Testing
```bash
npm test
```

## Environment variables
See `.env.example`.

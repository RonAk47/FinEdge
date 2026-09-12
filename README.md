# FinEdge API

Personal finance tracking REST API.

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
the repository interface, response shape, and error-handling pattern used by
the application.

## Module coverage

| Module         | Scope                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| Authentication | User registration, mock JWT sessions, and current-user access                                 |
| Transactions   | Transaction CRUD and input validation                                                         |
| Platform       | Error handling, request logging, JSON persistence, budgets, summaries, caching, and analytics |

## Testing

```bash
npm test
```

## API usage

- [API documentation and endpoint reference](./docs/README.md)
- [Postman collection](./docs/FinEdge.postman_collection.json)
- [Project brief](./docs/FinEdge.pdf)

The API documentation includes Postman setup, authentication details, a cURL
walkthrough, summary filters, caching behavior, and error checks.

## Persistence

Entity services should import their file-backed repository from
`src/services/{entity}.repository.js`. The adapters share the same five-method
interface as `InMemoryRepository`, so controllers and business logic do not
need persistence-specific changes.

See `.env.example` for available environment variables.

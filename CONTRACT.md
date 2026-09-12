# Shared contract

This contract defines the interfaces shared across controllers, services, and
repositories.

## Repository interface

Every entity (`User`, `Transaction`, `Budget`) is accessed through an object
with these five async methods — nothing else:

```js
getAll(); // -> array of items
getById(id); // -> item or null
create(data); // -> created item (id assigned by the repo)
update(id, data); // -> updated item or null if not found
remove(id); // -> true if removed, false if not found
```

- Production repositories are backed by JSON files through
  `src/services/FileRepository.js`. Entity-specific adapters are available at:
    - `src/services/user.repository.js`
    - `src/services/transaction.repository.js`
    - `src/services/budget.repository.js`
- `InMemoryRepository` (`src/services/InMemoryRepository.js`) remains available
  for isolated unit tests. It implements the same interface in memory.

Example (in a service file):

```js
const transactionRepo = require('./transaction.repository');
```

The file repositories store arrays in `data/users.json`,
`data/transactions.json`, and `data/budgets.json`. Missing files are treated as
empty repositories and are created automatically on the first write. Writes
are atomic and serialized per file.

## Response shape

Always respond through `src/utils/response.js`, never `res.json()` directly:

```js
const { success, failure } = require('../utils/response');

success(res, data); // 200 { success: true, data }
success(res, data, 201); // 201 with a custom status code
failure(res, 'message', 404); // throwing a custom error delegates formatting
```

## Errors

Don't call `failure()` for expected error cases in a controller — `throw` one
of the custom errors from `src/utils/errors` instead, and let the global
error handler format the response:

```js
const { NotFoundError, ValidationError } = require('../utils/errors');

if (!transaction) throw new NotFoundError('Transaction not found');
if (!amount) throw new ValidationError('amount is required');
```

Wrap every async controller in `asyncHandler` so thrown/rejected errors reach
the global handler instead of crashing the server:

```js
const asyncHandler = require('../middleware/asyncHandler');

router.get('/:id', asyncHandler(async (req, res) => { ... }));
```

## Routes

Mount routers in `src/routes/index.js` and keep each entity route in a separate
file (`user.routes.js`, `transaction.routes.js`, etc.).

## Data field names

Use `src/models/*.js` as the source of truth for entity field names. Coordinate
any field-name changes before updating dependent modules.

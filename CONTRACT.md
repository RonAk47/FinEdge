# Shared contract

Agree on this before anyone writes controller code. It's what lets all 4 of
you build in parallel without blocking each other.

## Repository interface

Every entity (`User`, `Transaction`, `Budget`) is accessed through an object
with these five async methods — nothing else:

```js
getAll()          // -> array of items
getById(id)       // -> item or null
create(data)      // -> created item (id assigned by the repo)
update(id, data)  // -> updated item or null if not found
remove(id)        // -> true if removed, false if not found
```

- Start by instantiating `InMemoryRepository` (`src/services/InMemoryRepository.js`)
  for your own entity. It already implements this interface, backed by a
  plain array — nothing to build, just import and use.
- Ronak builds the real `fs/promises`-backed repository against the exact
  same interface. At integration time, swap the import — no other code changes.

Example (in a service file):
```js
const InMemoryRepository = require('./InMemoryRepository');
const transactionRepo = new InMemoryRepository();
// later, once Ronak's real one lands:
// const transactionRepo = require('./transaction.repository');
```

## Response shape

Always respond through `src/utils/response.js`, never `res.json()` directly:

```js
const { success, failure } = require('../utils/response');

success(res, data);            // 200 { success: true, data }
success(res, data, 201);       // 201 with a custom status code
failure(res, 'message', 404);  // handled automatically if you throw instead — see below
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

Mount your router in `src/routes/index.js` by uncommenting your line. Keep
each person's route file separate (`user.routes.js`, `transaction.routes.js`,
etc.) so route-file edits never conflict across branches.

## Data field names

See `src/models/*.js` for the agreed field names per entity. If you need to
change a field name, say so in the group chat first — others may already be
building against it.

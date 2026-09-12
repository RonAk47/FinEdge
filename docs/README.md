# FinEdge API Documentation

This document covers the FinEdge API endpoints and provides Postman and cURL examples for calling the API.

## API endpoints

| Method | Route                                        | Description                                             |
| ------ | -------------------------------------------- | ------------------------------------------------------- |
| GET    | `/api/health`                                | Server health check                                     |
| POST   | `/api/users`                                 | Register new user                                       |
| POST   | `/api/users/login`                           | Log in, returns a mock JWT                              |
| GET    | `/api/users/me`                              | Current user (requires `Authorization: Bearer <token>`) |
| POST   | `/api/transactions`                          | Add income/expense                                      |
| GET    | `/api/transactions`                          | Fetch all transactions                                  |
| GET    | `/api/transactions/:id`                      | View single transaction                                 |
| PATCH  | `/api/transactions/:id`                      | Update transaction                                      |
| DELETE | `/api/transactions/:id`                      | Delete transaction                                      |
| GET    | `/api/summary`                               | Income/expense summary                                  |
| GET    | `/api/summary?category=Food`                 | Filter summary by category                              |
| GET    | `/api/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Filter summary by date range                            |
| GET    | `/api/summary?month=YYYY-MM&userId=<id>`     | Filter summary by month and user                        |
| GET    | `/api/budgets`                               | List budgets                                            |
| POST   | `/api/budgets`                               | Create a monthly budget                                 |
| GET    | `/api/budgets/:id`                           | View a budget                                           |
| PATCH  | `/api/budgets/:id`                           | Update a budget                                         |
| DELETE | `/api/budgets/:id`                           | Delete a budget                                         |

## Postman collection

Import [FinEdge.postman_collection.json](./FinEdge.postman_collection.json) into Postman. Set the collection `email` variable to a unique email address, start the API, and run the folders in this order:

1. Health
2. Users
3. Transactions
4. Budgets
5. Summary
6. Error checks

The registration and login requests automatically store the JWT and user ID. Create requests automatically store transaction and budget IDs for subsequent requests. The `Summary cache hit` request should be run after the equivalent month summary request to observe the cache-hit log in the API process.

All transaction, budget, and summary requests require the JWT returned by registration or login. User ownership is derived from the token; request-body or query-string `userId` values are ignored for authorization.

## cURL walkthrough

Start the API from the project root:

```bash
cp .env.example .env
npm install
npm run dev
```

Run the requests below in order from another terminal. The examples use `jq` to capture IDs and the JWT from JSON responses. If `jq` is unavailable, copy those values from each response and assign them manually.

```bash
BASE_URL=http://localhost:3000/api
EMAIL="demo.$(date +%s)@example.com"
PASSWORD='sup3rsecret'
```

### 1. Health check

```bash
curl --fail --silent "$BASE_URL/health" | jq
```

Expected status: `200`.

### 2. Register a user

```bash
USER_RESPONSE=$(curl --fail --silent \
  -X POST "$BASE_URL/users" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Demo User\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"preferences\":{\"currency\":\"INR\"}}")

echo "$USER_RESPONSE" | jq
USER_ID=$(echo "$USER_RESPONSE" | jq -r '.data.user.id')
TOKEN=$(echo "$USER_RESPONSE" | jq -r '.data.token')
```

Expected status: `201`. The response contains the user ID and mock JWT token.

### 3. Log in

```bash
LOGIN_RESPONSE=$(curl --fail --silent \
  -X POST "$BASE_URL/users/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
```

Expected status: `200`.

### 4. Read the authenticated user

```bash
curl --fail --silent \
  "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Expected status: `200`.

### 5. Create transactions

```bash
INCOME_RESPONSE=$(curl --fail --silent \
  -X POST "$BASE_URL/transactions" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"type\":\"income\",\"category\":\"Salary\",\"amount\":6000,\"date\":\"2026-09-01\"}")

EXPENSE_RESPONSE=$(curl --fail --silent \
  -X POST "$BASE_URL/transactions" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"type\":\"expense\",\"category\":\"Food\",\"amount\":800,\"date\":\"2026-09-02\"}")

echo "$INCOME_RESPONSE" | jq
echo "$EXPENSE_RESPONSE" | jq
INCOME_ID=$(echo "$INCOME_RESPONSE" | jq -r '.data.id')
EXPENSE_ID=$(echo "$EXPENSE_RESPONSE" | jq -r '.data.id')
```

Expected status for each request: `201`.

### 6. Read and update transactions

```bash
curl --fail --silent "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" | jq
curl --fail --silent "$BASE_URL/transactions/$INCOME_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

curl --fail --silent \
  -X PATCH "$BASE_URL/transactions/$EXPENSE_ID" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":950,"category":"Dining"}' | jq
```

Expected statuses: `200` for each request.

### 7. Create and manage a budget

```bash
BUDGET_RESPONSE=$(curl --fail --silent \
  -X POST "$BASE_URL/budgets" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"month\":\"2026-09\",\"goal\":6000,\"savingsTarget\":1200}")

echo "$BUDGET_RESPONSE" | jq
BUDGET_ID=$(echo "$BUDGET_RESPONSE" | jq -r '.data.id')

curl --fail --silent "$BASE_URL/budgets" \
  -H "Authorization: Bearer $TOKEN" | jq
curl --fail --silent "$BASE_URL/budgets/$BUDGET_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

curl --fail --silent \
  -X PATCH "$BASE_URL/budgets/$BUDGET_ID" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"savingsTarget":1500}' | jq
```

Expected status: `201` for creation and `200` for the remaining requests.

### 8. Read the summary and analytics filters

```bash
# Overall totals and monthly trends
curl --fail --silent "$BASE_URL/summary" \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by user and month
curl --fail --silent \
  "$BASE_URL/summary?month=2026-09" \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by category
curl --fail --silent \
  "$BASE_URL/summary?category=dining" \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by date range
curl --fail --silent \
  "$BASE_URL/summary?from=2026-09-01&to=2026-09-30" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Expected status: `200`. The summary includes `totalIncome`, `totalExpenses`, `balance`, `transactionCount`, and `monthlyTrends`.

Run the same summary request twice to exercise the TTL cache. The second request returns the cached result and logs `Summary cache hit`; cache misses are intentionally silent. Transaction create, update, and delete operations invalidate cached summaries.

### 9. Delete test data

```bash
curl --fail --silent \
  -X DELETE "$BASE_URL/transactions/$EXPENSE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

curl --fail --silent \
  -X DELETE "$BASE_URL/budgets/$BUDGET_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Expected status: `200` for each request.

### Error checks

```bash
# Unknown route: 404
curl --silent -i "$BASE_URL/does-not-exist"

# Invalid transaction payload: 400
curl --silent -i \
  -X POST "$BASE_URL/transactions" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"invalid","amount":-1}'

# Missing authentication: 401
curl --silent -i "$BASE_URL/users/me"
```

## Environment variables

See [`.env.example`](../.env.example).

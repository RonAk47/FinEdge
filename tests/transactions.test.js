jest.mock('../src/services/transaction.repository', () => {
    const InMemoryRepository = require('../src/services/InMemoryRepository');
    return new InMemoryRepository();
});

const supertest = require('supertest');
const { signToken } = require('../src/utils/jwt');

const transactionRepository = require('../src/services/transaction.repository');
const app = require('../src/app');

const request = (application) => {
    const client = supertest(application);
    const authorization = `Bearer ${signToken({
        sub: 'user-1',
        email: 'user-1@example.com'
    })}`;
    return ['get', 'post', 'patch', 'delete'].reduce((api, method) => {
        api[method] = (...args) =>
            client[method](...args).set('Authorization', authorization);
        return api;
    }, {});
};

const validTransaction = {
    userId: 'user-1',
    type: 'expense',
    category: 'Food',
    amount: 250,
    date: '2026-09-10'
};

describe('Transactions API', () => {
    beforeEach(async () => {
        await transactionRepository.getAll().then(async (items) => {
            for (const item of [...items]) {
                await transactionRepository.remove(item.id);
            }
        });
    });

    test('rejects requests without authentication', async () => {
        const response = await supertest(app).get('/api/transactions');

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe('Missing bearer token');
    });

    describe('POST /api/transactions', () => {
        test('should create a transaction', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .send(validTransaction);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            expect(response.body.data).toMatchObject({
                userId: 'user-1',
                type: 'expense',
                category: 'Food',
                amount: 250,
                date: '2026-09-10'
            });

            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.createdAt).toBeDefined();
        });

        test('should reject missing required fields', async () => {
            const response = await request(app).post('/api/transactions').send({
                userId: 'user-1',
                amount: 250
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe(
                'Invalid transaction payload'
            );
        });

        test('should reject invalid transaction type', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .send({
                    ...validTransaction,
                    type: 'salary'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should reject invalid amount', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .send({
                    ...validTransaction,
                    amount: -100
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should reject amount provided as a string', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .send({
                    ...validTransaction,
                    amount: '250'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should reject invalid date', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .send({
                    ...validTransaction,
                    date: '2026-99-99'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should reject unknown fields', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .send({
                    ...validTransaction,
                    randomField: 'not allowed'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/transactions', () => {
        test('should return all transactions', async () => {
            await request(app).post('/api/transactions').send(validTransaction);

            await request(app)
                .post('/api/transactions')
                .send({
                    ...validTransaction,
                    type: 'income',
                    category: 'Salary',
                    amount: 50000
                });

            const response = await request(app).get('/api/transactions');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });
    });

    describe('GET /api/transactions/:id', () => {
        test('should return a transaction by id', async () => {
            const createResponse = await request(app)
                .post('/api/transactions')
                .send(validTransaction);

            const id = createResponse.body.data.id;

            const response = await request(app).get(`/api/transactions/${id}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            expect(response.body.data).toMatchObject({
                id,
                userId: 'user-1',
                type: 'expense',
                category: 'Food',
                amount: 250,
                date: '2026-09-10'
            });
        });

        test('should return 404 for non-existent transaction', async () => {
            const response = await request(app).get(
                '/api/transactions/not-found'
            );

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe('Transaction not found');
        });
    });

    describe('PATCH /api/transactions/:id', () => {
        test('should update a transaction', async () => {
            const createResponse = await request(app)
                .post('/api/transactions')
                .send(validTransaction);

            const id = createResponse.body.data.id;

            const response = await request(app)
                .patch(`/api/transactions/${id}`)
                .send({
                    amount: 500,
                    category: 'Shopping'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            expect(response.body.data).toMatchObject({
                id,
                userId: 'user-1',
                type: 'expense',
                category: 'Shopping',
                amount: 500,
                date: '2026-09-10'
            });
        });

        test('should reject empty update body', async () => {
            const createResponse = await request(app)
                .post('/api/transactions')
                .send(validTransaction);

            const id = createResponse.body.data.id;

            const response = await request(app)
                .patch(`/api/transactions/${id}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should return 404 when updating non-existent transaction', async () => {
            const response = await request(app)
                .patch('/api/transactions/not-found')
                .send({
                    amount: 500
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/transactions/:id', () => {
        test('should delete a transaction', async () => {
            const createResponse = await request(app)
                .post('/api/transactions')
                .send(validTransaction);

            const id = createResponse.body.data.id;

            const response = await request(app).delete(
                `/api/transactions/${id}`
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe(
                'Transaction deleted successfully'
            );

            const getResponse = await request(app).get(
                `/api/transactions/${id}`
            );

            expect(getResponse.status).toBe(404);
        });

        test('should return 404 when deleting non-existent transaction', async () => {
            const response = await request(app).delete(
                '/api/transactions/not-found'
            );

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });
});

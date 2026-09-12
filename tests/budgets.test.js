jest.mock('../src/services/budget.repository', () => {
    const InMemoryRepository = require('../src/services/InMemoryRepository');
    return new InMemoryRepository();
});

const supertest = require('supertest');
const { signToken } = require('../src/utils/jwt');
const budgetRepository = require('../src/services/budget.repository');
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

const validBudget = {
    userId: 'user-1',
    month: '2026-09',
    goal: 5000,
    savingsTarget: 1000
};

describe('Budgets API', () => {
    beforeEach(async () => {
        const budgets = await budgetRepository.getAll();
        await Promise.all(
            budgets.map((budget) => budgetRepository.remove(budget.id))
        );
    });

    it('creates and retrieves a budget', async () => {
        const createResponse = await request(app)
            .post('/api/budgets')
            .send(validBudget);

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.data).toMatchObject(validBudget);
        expect(createResponse.body.data.id).toEqual(expect.any(String));
        expect(createResponse.body.data.createdAt).toEqual(expect.any(String));

        const getResponse = await request(app).get(
            `/api/budgets/${createResponse.body.data.id}`
        );

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.data).toEqual(createResponse.body.data);
    });

    it('lists, updates, and deletes budgets', async () => {
        const created = await request(app)
            .post('/api/budgets')
            .send(validBudget);
        const id = created.body.data.id;

        const listResponse = await request(app).get('/api/budgets');
        expect(listResponse.body.data).toHaveLength(1);

        const updateResponse = await request(app)
            .patch(`/api/budgets/${id}`)
            .send({ savingsTarget: 1500 });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.data).toMatchObject({
            ...validBudget,
            savingsTarget: 1500
        });

        const deleteResponse = await request(app).delete(`/api/budgets/${id}`);
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.data.message).toBe(
            'Budget deleted successfully'
        );

        await expect(
            request(app).get(`/api/budgets/${id}`)
        ).resolves.toMatchObject({
            status: 404
        });
    });

    it('rejects invalid budget data', async () => {
        const response = await request(app)
            .post('/api/budgets')
            .send({ ...validBudget, month: '2026-13', goal: -1 });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe('Invalid budget payload');
        expect(response.body.error.details).toEqual(
            expect.arrayContaining([
                { field: 'month', message: 'month must use YYYY-MM format' },
                { field: 'goal', message: 'goal must be a non-negative number' }
            ])
        );
    });

    it('rejects an empty update', async () => {
        const created = await request(app)
            .post('/api/budgets')
            .send(validBudget);

        const response = await request(app)
            .patch(`/api/budgets/${created.body.data.id}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe('Invalid budget payload');
    });
});

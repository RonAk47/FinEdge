const fs = require('fs');
const os = require('os');
const path = require('path');

const temporaryDataDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'finedge-integration-')
);
const originalDataDirectory = process.env.DATA_DIR;
process.env.DATA_DIR = temporaryDataDirectory;

const request = require('supertest');
const { signToken } = require('../src/utils/jwt');
const app = require('../src/app');
const authenticate = (requestBuilder, token) =>
    requestBuilder.set('Authorization', `Bearer ${token}`);
const repositories = [
    require('../src/services/user.repository'),
    require('../src/services/transaction.repository'),
    require('../src/services/budget.repository')
];

const clearRepository = async (repository) => {
    const items = [...(await repository.getAll())];
    for (const item of items) {
        await repository.remove(item.id);
    }
};

const clearDataFiles = async () => {
    await Promise.all(repositories.map(clearRepository));
};

describe('FinEdge system integration', () => {
    beforeAll(async () => {
        await clearDataFiles();
    });

    afterAll(async () => {
        await clearDataFiles();
        await fs.promises.rm(temporaryDataDirectory, {
            recursive: true,
            force: true
        });
        if (originalDataDirectory === undefined) {
            delete process.env.DATA_DIR;
        } else {
            process.env.DATA_DIR = originalDataDirectory;
        }
    });

    it('persists a user, transactions, summary, and budget through the API', async () => {
        const userResponse = await request(app).post('/api/users').send({
            name: 'Integration User',
            email: 'integration@example.com',
            password: 'sup3rsecret'
        });

        expect(userResponse.status).toBe(201);
        const userId = userResponse.body.data.user.id;

        const incomeResponse = await authenticate(
            request(app).post('/api/transactions').send({
                type: 'income',
                category: 'Salary',
                amount: 5000,
                date: '2026-09-01'
            }),
            userResponse.body.data.token
        );
        const expenseResponse = await authenticate(
            request(app).post('/api/transactions').send({
                type: 'expense',
                category: 'Food',
                amount: 750,
                date: '2026-09-02'
            }),
            userResponse.body.data.token
        );

        expect(incomeResponse.status).toBe(201);
        expect(expenseResponse.status).toBe(201);

        const summaryResponse = await authenticate(
            request(app)
                .get('/api/summary')
                .query({ userId, month: '2026-09' }),
            userResponse.body.data.token
        );

        expect(summaryResponse.status).toBe(200);
        expect(summaryResponse.body.data).toMatchObject({
            totalIncome: 5000,
            totalExpenses: 750,
            balance: 4250,
            transactionCount: 2
        });

        const budgetResponse = await authenticate(
            request(app).post('/api/budgets').send({
                month: '2026-09',
                goal: 5000,
                savingsTarget: 1000
            }),
            userResponse.body.data.token
        );

        expect(budgetResponse.status).toBe(201);
        expect(budgetResponse.body.data.userId).toBe(userId);

        const persistedData = await Promise.all(
            repositories.map((repository) => repository.getAll())
        );
        expect(persistedData[0]).toHaveLength(1);
        expect(persistedData[1]).toHaveLength(2);
        expect(persistedData[2]).toHaveLength(1);
    });

    it('returns consistent errors for missing resources', async () => {
        const unauthenticatedSummary = await request(app).get('/api/summary');
        const unauthenticatedBudget = await request(app).get('/api/budgets');

        expect(unauthenticatedSummary.status).toBe(401);
        expect(unauthenticatedBudget.status).toBe(401);

        const response = await authenticate(
            request(app).get('/api/budgets/missing'),
            signToken({ sub: 'user-1', email: 'user-1@example.com' })
        );

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            error: { message: 'Budget not found' }
        });
    });
});

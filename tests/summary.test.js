jest.mock('../src/services/transaction.repository', () => {
    const InMemoryRepository = require('../src/services/InMemoryRepository');
    return new InMemoryRepository();
});

const supertest = require('supertest');
const { signToken } = require('../src/utils/jwt');
const transactionRepository = require('../src/services/transaction.repository');
const summaryService = require('../src/services/summary.service');
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

const transactions = [
    {
        userId: 'user-1',
        type: 'income',
        category: 'Salary',
        amount: 5000,
        date: '2026-09-01'
    },
    {
        userId: 'user-1',
        type: 'expense',
        category: 'Food',
        amount: 500,
        date: '2026-09-02'
    },
    {
        userId: 'user-1',
        type: 'expense',
        category: 'Rent',
        amount: 1500,
        date: '2026-08-01'
    }
];

const seedTransactions = async () => {
    await Promise.all(
        transactions.map((transaction) =>
            transactionRepository.create(transaction)
        )
    );
    summaryService.invalidateSummaryCache();
};

describe('Summary API', () => {
    beforeEach(async () => {
        const existing = [...(await transactionRepository.getAll())];
        for (const transaction of existing) {
            await transactionRepository.remove(transaction.id);
        }
        summaryService.invalidateSummaryCache();
    });

    it('calculates income, expenses, balance, and monthly trends', async () => {
        await seedTransactions();

        const response = await request(app).get('/api/summary');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual({
            totalIncome: 5000,
            totalExpenses: 2000,
            balance: 3000,
            transactionCount: 3,
            monthlyTrends: [
                { month: '2026-08', income: 0, expenses: 1500, balance: -1500 },
                { month: '2026-09', income: 5000, expenses: 500, balance: 4500 }
            ]
        });
    });

    it('filters by category, date range, month, and user', async () => {
        await seedTransactions();

        const response = await request(app).get('/api/summary').query({
            category: 'food',
            from: '2026-09-01',
            to: '2026-09-30',
            userId: 'user-1'
        });

        expect(response.body.data).toMatchObject({
            totalIncome: 0,
            totalExpenses: 500,
            balance: -500,
            transactionCount: 1
        });

        const monthResponse = await request(app)
            .get('/api/summary')
            .query({ month: '2026-08' });
        expect(monthResponse.body.data.transactionCount).toBe(1);
        expect(monthResponse.body.data.totalExpenses).toBe(1500);
    });

    it('returns a validation error for invalid filters', async () => {
        const response = await request(app)
            .get('/api/summary')
            .query({ from: '2026-99-99', month: '2026-09' });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe('Invalid summary filters');
    });

    it('uses the cache for repeated equivalent requests', async () => {
        await seedTransactions();
        const getAll = jest.spyOn(transactionRepository, 'getAll');
        const log = jest.spyOn(console, 'log').mockImplementation(() => {});

        await summaryService.getSummary({ month: '2026-09' });
        await summaryService.getSummary({ month: '2026-09' });

        expect(getAll).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith('Summary cache hit');

        log.mockRestore();
    });

    it('invalidates the cache when a transaction changes', async () => {
        await seedTransactions();
        await request(app).get('/api/summary');

        await request(app).post('/api/transactions').send({
            userId: 'user-1',
            type: 'expense',
            category: 'Travel',
            amount: 250,
            date: '2026-09-10'
        });

        const response = await request(app).get('/api/summary');
        expect(response.body.data.totalExpenses).toBe(2250);
        expect(response.body.data.balance).toBe(2750);
    });
});

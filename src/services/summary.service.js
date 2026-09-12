const config = require('../config');
const transactionRepository = require('./transaction.repository');
const TtlCache = require('./TtlCache');
const { ValidationError } = require('../utils/errors');

const summaryCache = new TtlCache(config.cache.ttlMs);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const isValidDate = (value) => {
    if (!DATE_PATTERN.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
        !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    );
};

const normalizeFilters = ({ category, from, to, month } = {}, userId) => {
    const details = [];
    const filters = {
        category:
            category === undefined
                ? undefined
                : String(category).trim().toLowerCase(),
        from,
        to,
        month,
        userId: userId === undefined ? undefined : String(userId).trim()
    };

    if (filters.category === '')
        details.push({
            field: 'category',
            message: 'category cannot be empty'
        });
    if (filters.userId === '')
        details.push({ field: 'userId', message: 'userId cannot be empty' });
    if (filters.from !== undefined && !isValidDate(filters.from)) {
        details.push({
            field: 'from',
            message: 'from must use YYYY-MM-DD format'
        });
    }
    if (filters.to !== undefined && !isValidDate(filters.to)) {
        details.push({ field: 'to', message: 'to must use YYYY-MM-DD format' });
    }
    if (filters.month !== undefined && !MONTH_PATTERN.test(filters.month)) {
        details.push({
            field: 'month',
            message: 'month must use YYYY-MM format'
        });
    }
    if (
        filters.month !== undefined &&
        (filters.from !== undefined || filters.to !== undefined)
    ) {
        details.push({
            field: 'month',
            message: 'month cannot be combined with from or to'
        });
    }
    if (filters.from && filters.to && filters.from > filters.to) {
        details.push({
            field: 'date',
            message: 'from must be before or equal to to'
        });
    }

    if (details.length)
        throw new ValidationError('Invalid summary filters', details);
    return filters;
};

const matchesFilters = (transaction, filters) => {
    if (
        filters.category &&
        transaction.category.trim().toLowerCase() !== filters.category
    )
        return false;
    if (filters.userId && transaction.userId !== filters.userId) return false;
    if (filters.month && !transaction.date.startsWith(filters.month))
        return false;
    if (filters.from && transaction.date < filters.from) return false;
    if (filters.to && transaction.date > filters.to) return false;
    return true;
};

const calculateSummary = (transactions) => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const monthly = new Map();

    transactions.forEach((transaction) => {
        const amount = Number(transaction.amount);
        if (transaction.type === 'income') totalIncome += amount;
        if (transaction.type === 'expense') totalExpenses += amount;

        const month = transaction.date.slice(0, 7);
        const current = monthly.get(month) || { income: 0, expenses: 0 };
        if (transaction.type === 'income') current.income += amount;
        if (transaction.type === 'expense') current.expenses += amount;
        monthly.set(month, current);
    });

    const monthlyTrends = [...monthly.entries()]
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([month, values]) => ({
            month,
            income: values.income,
            expenses: values.expenses,
            balance: values.income - values.expenses
        }));

    return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        monthlyTrends
    };
};

const getSummary = async (rawFilters = {}, userId) => {
    const filters = normalizeFilters(rawFilters, userId);
    const cacheKey = JSON.stringify(filters);
    const cached = summaryCache.get(cacheKey);
    if (cached) {
        console.log('Summary cache hit');
        return cached;
    }

    const transactions = await transactionRepository.getAll();
    const summary = calculateSummary(
        transactions.filter((transaction) =>
            matchesFilters(transaction, filters)
        )
    );
    summaryCache.set(cacheKey, summary);
    return summary;
};

const invalidateSummaryCache = () => summaryCache.clear();

module.exports = {
    getSummary,
    invalidateSummaryCache,
    normalizeFilters,
    calculateSummary
};

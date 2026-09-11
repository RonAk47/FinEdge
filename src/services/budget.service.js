const budgetRepository = require('./budget.repository');
const { NotFoundError } = require('../utils/errors');
const {
    createBudgetData,
    validateBudgetData,
    validateBudgetPatch
} = require('../models/Budget');

const getBudgets = async (userId) => {
    const budgets = await budgetRepository.getAll();
    return budgets.filter((budget) => budget.userId === userId);
};

const getBudget = async (id, userId) => {
    const budget = await budgetRepository.getById(id);
    if (!budget || budget.userId !== userId)
        throw new NotFoundError('Budget not found');
    return budget;
};

const createBudget = async (payload = {}) => {
    validateBudgetData(payload);
    return budgetRepository.create(createBudgetData(payload));
};

const updateBudget = async (id, payload = {}, userId) => {
    validateBudgetPatch(payload);
    const existing = await budgetRepository.getById(id);
    if (!existing || existing.userId !== userId)
        throw new NotFoundError('Budget not found');

    const budget = await budgetRepository.update(id, { ...payload, userId });
    return budget;
};

const deleteBudget = async (id, userId) => {
    const existing = await budgetRepository.getById(id);
    if (!existing || existing.userId !== userId)
        throw new NotFoundError('Budget not found');

    const removed = await budgetRepository.remove(id);
    if (!removed) throw new NotFoundError('Budget not found');
};

module.exports = {
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget
};

const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/response');
const budgetService = require('../services/budget.service');

const getBudgets = asyncHandler(async (req, res) => {
    success(res, await budgetService.getBudgets(req.user.id));
});

const getBudget = asyncHandler(async (req, res) => {
    success(res, await budgetService.getBudget(req.params.id, req.user.id));
});

const createBudget = asyncHandler(async (req, res) => {
    success(
        res,
        await budgetService.createBudget({
            ...req.body,
            userId: req.user.id
        }),
        201
    );
});

const updateBudget = asyncHandler(async (req, res) => {
    const { userId, ...updates } = req.body;
    success(
        res,
        await budgetService.updateBudget(req.params.id, updates, req.user.id)
    );
});

const deleteBudget = asyncHandler(async (req, res) => {
    await budgetService.deleteBudget(req.params.id, req.user.id);
    success(res, { message: 'Budget deleted successfully' });
});

module.exports = {
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget
};

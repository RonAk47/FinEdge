/**
 * Budget shape:
 * { userId, month: 'YYYY-MM', goal, savingsTarget, createdAt }
 */
const { ValidationError } = require('../utils/errors');

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const validateBudgetData = ({ userId, month, goal, savingsTarget }) => {
    const details = [];

    if (typeof userId !== 'string' || !userId.trim()) {
        details.push({ field: 'userId', message: 'userId is required' });
    }
    if (typeof month !== 'string' || !MONTH_PATTERN.test(month)) {
        details.push({
            field: 'month',
            message: 'month must use YYYY-MM format'
        });
    }
    if (!Number.isFinite(goal) || goal < 0) {
        details.push({
            field: 'goal',
            message: 'goal must be a non-negative number'
        });
    }
    if (!Number.isFinite(savingsTarget) || savingsTarget < 0) {
        details.push({
            field: 'savingsTarget',
            message: 'savingsTarget must be a non-negative number'
        });
    }

    if (details.length)
        throw new ValidationError('Invalid budget payload', details);
};

const validateBudgetPatch = (payload) => {
    if (!payload || Object.keys(payload).length === 0) {
        throw new ValidationError('Invalid budget payload', [
            {
                field: 'body',
                message: 'at least one field is required for update'
            }
        ]);
    }

    const allowedFields = ['userId', 'month', 'goal', 'savingsTarget'];
    const unknownFields = Object.keys(payload).filter(
        (field) => !allowedFields.includes(field)
    );
    if (unknownFields.length) {
        throw new ValidationError(
            'Invalid budget payload',
            unknownFields.map((field) => ({
                field,
                message: 'field is not allowed'
            }))
        );
    }

    validateBudgetData({
        userId: payload.userId === undefined ? 'valid' : payload.userId,
        month: payload.month === undefined ? '2000-01' : payload.month,
        goal: payload.goal === undefined ? 0 : payload.goal,
        savingsTarget:
            payload.savingsTarget === undefined ? 0 : payload.savingsTarget
    });
};

const createBudgetData = ({ userId, month, goal, savingsTarget }) => ({
    userId: userId.trim(),
    month,
    goal,
    savingsTarget,
    createdAt: new Date().toISOString()
});

module.exports = {
    createBudgetData,
    validateBudgetData,
    validateBudgetPatch
};

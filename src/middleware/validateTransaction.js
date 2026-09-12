const ValidationError = require('../utils/errors/ValidationError');

const VALID_TYPES = ['income', 'expense'];

const ALLOWED_FIELDS = ['userId', 'type', 'category', 'amount', 'date'];

const isValidDate = (value) => {
    if (typeof value !== 'string') {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        date.getUTCFullYear() === Number(value.substring(0, 4)) &&
        date.getUTCMonth() + 1 === Number(value.substring(5, 7)) &&
        date.getUTCDate() === Number(value.substring(8, 10))
    );
};

const validateFields = (body, required) => {
    const errors = [];

    const unknownFields = Object.keys(body).filter(
        (field) => !ALLOWED_FIELDS.includes(field)
    );

    unknownFields.forEach((field) => {
        errors.push(`${field} is not allowed`);
    });

    if (body.userId !== undefined) {
        if (
            typeof body.userId !== 'string' ||
            body.userId.trim().length === 0
        ) {
            errors.push('userId is required and must be a non-empty string');
        }
    }

    if (required || body.type !== undefined) {
        if (!VALID_TYPES.includes(body.type)) {
            errors.push('type must be either income or expense');
        }
    }

    if (required || body.category !== undefined) {
        if (
            typeof body.category !== 'string' ||
            body.category.trim().length === 0
        ) {
            errors.push('category is required and must be a non-empty string');
        }
    }

    if (required || body.amount !== undefined) {
        if (
            typeof body.amount !== 'number' ||
            !Number.isFinite(body.amount) ||
            body.amount <= 0
        ) {
            errors.push('amount must be a positive number');
        }
    }

    if (required || body.date !== undefined) {
        if (!isValidDate(body.date)) {
            errors.push('date must be a valid date in YYYY-MM-DD format');
        }
    }

    return errors;
};

const validateCreateTransaction = (req, res, next) => {
    const errors = validateFields(req.body, true);

    if (errors.length > 0) {
        throw new ValidationError('Invalid transaction payload', errors);
    }

    next();
};

const validateUpdateTransaction = (req, res, next) => {
    const fields = Object.keys(req.body);

    if (fields.length === 0) {
        throw new ValidationError('Invalid transaction payload', [
            'At least one field is required for update'
        ]);
    }

    const errors = validateFields(req.body, false);

    if (errors.length > 0) {
        throw new ValidationError('Invalid transaction payload', errors);
    }

    next();
};

module.exports = {
    validateCreateTransaction,
    validateUpdateTransaction
};

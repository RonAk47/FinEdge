const {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError
} = require('../src/utils/errors');

describe('custom errors', () => {
    it('creates an operational AppError with a status code', () => {
        const error = new AppError('Something went wrong', 422);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Something went wrong');
        expect(error.statusCode).toBe(422);
        expect(error.isOperational).toBe(true);
    });

    it('creates a NotFoundError with a 404 status', () => {
        const error = new NotFoundError('Transaction not found');

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Transaction not found');
        expect(error.isOperational).toBe(true);
    });

    it('uses the default NotFoundError message', () => {
        const error = new NotFoundError();

        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(404);
    });

    it('creates a ValidationError with details and a 400 status', () => {
        const details = [{ field: 'amount', message: 'Amount is required' }];
        const error = new ValidationError('Invalid transaction', details);

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Invalid transaction');
        expect(error.details).toEqual(details);
        expect(error.isOperational).toBe(true);
    });

    it('uses the default ValidationError values', () => {
        const error = new ValidationError();

        expect(error.message).toBe('Invalid input');
        expect(error.statusCode).toBe(400);
        expect(error.details).toEqual([]);
    });

    it('creates an UnauthorizedError with a 401 status', () => {
        const error = new UnauthorizedError('Session required');

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Session required');
        expect(error.isOperational).toBe(true);
    });
});

const express = require('express');
const request = require('supertest');
const { NotFoundError, ValidationError } = require('../src/utils/errors');
const app = require('../src/app');

const loadErrorHandler = (nodeEnv) => {
    const originalNodeEnv = process.env.NODE_ENV;

    process.env.NODE_ENV = nodeEnv;
    jest.resetModules();
    const errorHandler = require('../src/middleware/errorHandler');

    if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
    } else {
        process.env.NODE_ENV = originalNodeEnv;
    }

    return errorHandler;
};

const createErrorApp = (error, nodeEnv = 'production') => {
    const testApp = express();
    const errorHandler = loadErrorHandler(nodeEnv);

    testApp.get('/error', (req, res, next) => next(error));
    testApp.use(errorHandler);

    return testApp;
};

afterEach(() => {
    jest.restoreAllMocks();
});

describe('global error handling', () => {
    it('returns a 404 response for unknown routes', async () => {
        const response = await request(app).get('/api/does-not-exist');

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            success: false,
            error: {
                message: 'Route not found: GET /api/does-not-exist'
            }
        });
    });

    it('formats validation errors with their status and details', async () => {
        const details = [{ field: 'amount', message: 'Amount is required' }];
        const testApp = createErrorApp(
            new ValidationError('Invalid transaction', details)
        );

        const response = await request(testApp).get('/error');

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            success: false,
            error: {
                message: 'Invalid transaction',
                details
            }
        });
    });

    it('hides unexpected error details in production', async () => {
        const error = new Error('Database connection failed');
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const testApp = createErrorApp(error);

        const response = await request(testApp).get('/error');

        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({
            success: false,
            error: {
                message: 'Internal server error'
            }
        });
        expect(response.body.error.stack).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(error);
    });

    it('does not expose unexpected error details outside development', async () => {
        const error = new Error('Sensitive internal failure');
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const testApp = createErrorApp(error, 'test');

        const response = await request(testApp).get('/error');

        expect(response.statusCode).toBe(500);
        expect(response.body.error.message).toBe('Internal server error');
        expect(response.body.error.stack).toBeUndefined();
    });

    it('preserves operational error messages', async () => {
        const testApp = createErrorApp(new NotFoundError('User not found'));

        const response = await request(testApp).get('/error');

        expect(response.statusCode).toBe(404);
        expect(response.body.error.message).toBe('User not found');
    });
});

const express = require('express');
const request = require('supertest');
const requestLogger = require('../src/middleware/requestLogger');

describe('request logger', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('logs method, URL, status code, and duration', async () => {
        const logger = jest.spyOn(console, 'log').mockImplementation(() => {});
        const app = express();

        app.use(requestLogger);
        app.post('/transactions', (req, res) => {
            res.status(201).send({ created: true });
        });

        await request(app).post('/transactions?source=test').expect(201);

        expect(logger).toHaveBeenCalledTimes(1);
        expect(logger).toHaveBeenCalledWith(
            expect.stringMatching(
                /^POST \/transactions\?source=test 201 - \d+\.\dms$/
            )
        );
    });
});

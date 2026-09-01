const { failure } = require('../utils/response');
const config = require('../config');

/**
 * Global error-handling middleware. Must be registered LAST in app.js
 * (after all routes) — Express recognizes it as an error handler by its
 * 4-argument signature.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (!err.isOperational) {
    // Unexpected/programmer error — log full detail server-side, never leak to client.
    console.error(err);
  }

  const details = config.nodeEnv === 'development' && !err.isOperational
    ? { stack: err.stack }
    : err.details;

  return failure(res, message, statusCode, details);
};

module.exports = errorHandler;

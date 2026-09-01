/**
 * Base class for all operational errors thrown intentionally in controllers/
 * services (as opposed to unexpected bugs). The global error handler checks
 * `isOperational` to decide whether to expose the message to the client.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

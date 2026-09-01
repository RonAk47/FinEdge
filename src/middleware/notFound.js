const { NotFoundError } = require('../utils/errors');

/**
 * Catches any request that didn't match a route and forwards a 404 to the
 * global error handler. Register right after all routes, before errorHandler.
 */
const notFound = (req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;

/**
 * Minimal request logger (method, path, status, duration). Person 3 owns
 * this — feel free to swap the console.log for a real logger (pino/winston)
 * as long as the same fields are captured.
 */
const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs.toFixed(1)}ms`
    );
  });

  next();
};

module.exports = requestLogger;

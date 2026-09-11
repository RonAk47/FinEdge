/**
 * Provides a consistent JSON response shape across application modules.
 */
const success = (res, data, statusCode = 200, meta = undefined) => {
    const body = { success: true, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
};

const failure = (res, message, statusCode = 500, details = undefined) => {
    const body = { success: false, error: { message } };
    if (details) body.error.details = details;
    return res.status(statusCode).json(body);
};

module.exports = { success, failure };

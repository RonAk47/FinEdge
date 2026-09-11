const { UnauthorizedError } = require('../utils/errors');
const { verifyToken } = require('../utils/jwt');

// Validates a mock JWT bearer token and exposes its identity on req.user.
const requireAuth = (req, res, next) => {
    const [scheme, token] = (req.get('authorization') || '').split(' ');
    if (scheme !== 'Bearer' || !token)
        throw new UnauthorizedError('Missing bearer token');

    const { sub, email } = verifyToken(token);
    req.user = { id: sub, email };
    next();
};

module.exports = requireAuth;

require('dotenv').config();

// Central place for env-derived config. Add new keys here as modules need them
// (per-module config, e.g. cache TTL, JWT secret) rather than reading
// process.env directly elsewhere.
module.exports = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_only_secret_do_not_use_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  cache: {
    ttlMs: Number(process.env.CACHE_TTL_MS) || 60000,
  },
};

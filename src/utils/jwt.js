const crypto = require('crypto');
const config = require('../config');
const { UnauthorizedError } = require('./errors');

const HEADER = { alg: 'HS256', typ: 'JWT' };
const SECONDS_PER_UNIT = { s: 1, m: 60, h: 3600, d: 86400 };

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

const sign = (content) =>
  crypto.createHmac('sha256', config.jwt.secret).update(content).digest('base64url');

// "1h" / "30m" / "7d" -> seconds; a bare number is read as seconds.
const parseExpiry = (value) => {
  const match = /^(\d+)([smhd])?$/.exec(String(value).trim());
  if (!match) throw new TypeError(`Invalid JWT_EXPIRES_IN value: ${value}`);
  return Number(match[1]) * SECONDS_PER_UNIT[match[2] || 's'];
};

const signToken = (claims) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = { ...claims, iat: issuedAt, exp: issuedAt + parseExpiry(config.jwt.expiresIn) };
  const content = `${encode(HEADER)}.${encode(payload)}`;
  return `${content}.${sign(content)}`;
};

const verifyToken = (token) => {
  const [header, payload, signature] = String(token).split('.');
  if (!header || !payload || !signature) throw new UnauthorizedError('Invalid token');

  const expected = Buffer.from(sign(`${header}.${payload}`));
  const provided = Buffer.from(signature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new UnauthorizedError('Invalid token');
  }

  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (claims.exp * 1000 <= Date.now()) throw new UnauthorizedError('Token expired');
  return claims;
};

module.exports = { signToken, verifyToken };

const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// Stored as "salt:derivedKey" (hex) so each hash carries its own salt.
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password, passwordHash) => {
  const [salt, key] = String(passwordHash).split(':');
  if (!salt || !key) return false;

  const stored = Buffer.from(key, 'hex');
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return stored.length === derivedKey.length && crypto.timingSafeEqual(stored, derivedKey);
};

module.exports = { hashPassword, verifyPassword };

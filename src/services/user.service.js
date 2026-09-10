const userRepo = require('./user.repository');
const { toPublicUser } = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { AppError, NotFoundError, UnauthorizedError, ValidationError } = require('../utils/errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const normalizeEmail = (email) => email.trim().toLowerCase();

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validateRegistration = ({ name, email, password, preferences }) => {
  const details = [];

  if (typeof name !== 'string' || !name.trim()) {
    details.push({ field: 'name', message: 'name is required' });
  }
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    details.push({ field: 'email', message: 'a valid email is required' });
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    details.push({
      field: 'password',
      message: `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  }
  if (preferences !== undefined && !isPlainObject(preferences)) {
    details.push({ field: 'preferences', message: 'preferences must be an object' });
  }

  if (details.length) throw new ValidationError('Invalid user payload', details);
};

const findByEmail = async (email) => {
  const users = await userRepo.getAll();
  return users.find((user) => user.email === email) || null;
};

const issueSession = (user) => ({
  user: toPublicUser(user),
  token: signToken({ sub: user.id, email: user.email }),
});

const registerUser = async (payload = {}) => {
  validateRegistration(payload);

  const email = normalizeEmail(payload.email);
  if (await findByEmail(email)) throw new AppError('Email already registered', 409);

  const user = await userRepo.create({
    name: payload.name.trim(),
    email,
    passwordHash: await hashPassword(payload.password),
    preferences: payload.preferences || {},
    createdAt: new Date().toISOString(),
  });

  return issueSession(user);
};

const loginUser = async ({ email, password } = {}) => {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ValidationError('email and password are required');
  }

  const user = await findByEmail(normalizeEmail(email));
  // Identical message for both failures so this can't be used to probe registered emails.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return issueSession(user);
};

const getUserById = async (id) => {
  const user = await userRepo.getById(id);
  if (!user) throw new NotFoundError('User not found');
  return toPublicUser(user);
};

module.exports = { registerUser, loginUser, getUserById };

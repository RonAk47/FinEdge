const request = require('supertest');

// CONTRACT.md keeps InMemoryRepository around for isolated tests — use it so the
// suite never writes to the shared data/users.json.
jest.mock('../src/services/user.repository', () => {
  const InMemoryRepository = require('../src/services/InMemoryRepository');
  return new InMemoryRepository();
});

const userRepo = require('../src/services/user.repository');
const app = require('../src/app');

const VALID_USER = {
  name: 'Ahsas Sharma',
  email: 'ahsas@example.com',
  password: 'sup3rsecret',
};

const registerUser = (overrides = {}) =>
  request(app).post('/api/users').send({ ...VALID_USER, ...overrides });

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

beforeEach(async () => {
  const users = [...(await userRepo.getAll())];
  await Promise.all(users.map((user) => userRepo.remove(user.id)));
});

describe('POST /api/users', () => {
  it('registers a user and returns a session token', async () => {
    const res = await registerUser({ preferences: { currency: 'INR' } });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      name: 'Ahsas Sharma',
      email: 'ahsas@example.com',
      preferences: { currency: 'INR' },
    });
    expect(res.body.data.user.id).toEqual(expect.any(String));
    expect(res.body.data.user.createdAt).toEqual(expect.any(String));
    expect(typeof res.body.data.token).toBe('string');
  });

  it('never exposes the password or its hash', async () => {
    const res = await registerUser();

    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('stores the password hashed, not in plain text', async () => {
    await registerUser();
    const [stored] = await userRepo.getAll();

    expect(stored.passwordHash).not.toContain(VALID_USER.password);
    expect(stored.passwordHash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
  });

  it('rejects a payload with missing and invalid fields', async () => {
    const res = await request(app).post('/api/users').send({ email: 'not-an-email' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid user payload');
    expect(res.body.error.details.map((detail) => detail.field)).toEqual([
      'name',
      'email',
      'password',
    ]);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await registerUser({ password: 'short' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details).toEqual([
      { field: 'password', message: 'password must be at least 8 characters' },
    ]);
  });

  it('rejects a duplicate email regardless of casing', async () => {
    await registerUser();
    const res = await registerUser({ email: 'AHSAS@Example.com' });

    expect(res.statusCode).toBe(409);
    expect(res.body.error.message).toBe('Email already registered');
  });
});

describe('POST /api/users/login', () => {
  it('returns a token for valid credentials', async () => {
    await registerUser();
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(VALID_USER.email);
    expect(typeof res.body.data.token).toBe('string');
  });

  it('rejects a wrong password and an unknown email with the same 401', async () => {
    await registerUser();

    const wrongPassword = await request(app)
      .post('/api/users/login')
      .send({ email: VALID_USER.email, password: 'wrongpassword' });
    const unknownEmail = await request(app)
      .post('/api/users/login')
      .send({ email: 'nobody@example.com', password: VALID_USER.password });

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    expect(wrongPassword.body.error.message).toBe('Invalid email or password');
    expect(unknownEmail.body.error.message).toBe('Invalid email or password');
  });

  it('rejects a request with no credentials', async () => {
    const res = await request(app).post('/api/users/login').send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toBe('email and password are required');
  });
});

describe('GET /api/users/me', () => {
  it('returns the signed-in user', async () => {
    const { body } = await registerUser();
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${body.data.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(body.data.user);
  });

  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.error.message).toBe('Missing bearer token');
  });

  it('rejects a tampered token', async () => {
    const { body } = await registerUser();
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${body.data.token.slice(0, -2)}xy`);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.message).toBe('Invalid token');
  });

  it('returns 404 when the token points at a deleted user', async () => {
    const { body } = await registerUser();
    await userRepo.remove(body.data.user.id);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${body.data.token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('User not found');
  });
});

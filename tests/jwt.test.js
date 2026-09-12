const { signToken, verifyToken } = require('../src/utils/jwt');
const { hashPassword, verifyPassword } = require('../src/utils/password');
const crypto = require('crypto');
const config = require('../src/config');

describe('mock JWT', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('signs a three-part token and verifies its claims', () => {
        const token = signToken({ sub: 'user-1', email: 'ahsas@example.com' });
        const claims = verifyToken(token);

        expect(token.split('.')).toHaveLength(3);
        expect(claims).toMatchObject({
            sub: 'user-1',
            email: 'ahsas@example.com'
        });
        expect(claims.exp - claims.iat).toBe(3600);
    });

    it('rejects a malformed token', () => {
        expect(() => verifyToken('not-a-token')).toThrow('Invalid token');
    });

    it('rejects a correctly signed token with malformed claims', () => {
        const header = Buffer.from(
            JSON.stringify({ alg: 'HS256', typ: 'JWT' })
        ).toString('base64url');
        const payload = Buffer.from('not-json').toString('base64url');
        const content = `${header}.${payload}`;
        const signature = crypto
            .createHmac('sha256', config.jwt.secret)
            .update(content)
            .digest('base64url');

        expect(() => verifyToken(`${content}.${signature}`)).toThrow(
            'Invalid token'
        );
    });

    it('rejects tokens without a subject or expiry claim', () => {
        expect(() =>
            verifyToken(signToken({ email: 'user@example.com' }))
        ).toThrow('Invalid token');
    });

    it('rejects a token signed with a different secret', () => {
        const [header, payload] = signToken({ sub: 'user-1' }).split('.');

        expect(() =>
            verifyToken(`${header}.${payload}.forgedsignature`)
        ).toThrow('Invalid token');
    });

    it('rejects an expired token', () => {
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        jest.spyOn(Date, 'now').mockReturnValueOnce(twoHoursAgo);
        const token = signToken({ sub: 'user-1' });

        expect(() => verifyToken(token)).toThrow('Token expired');
    });
});

describe('password hashing', () => {
    it('produces a salted hash that verifies only the right password', async () => {
        const passwordHash = await hashPassword('sup3rsecret');

        await expect(verifyPassword('sup3rsecret', passwordHash)).resolves.toBe(
            true
        );
        await expect(
            verifyPassword('wrongpassword', passwordHash)
        ).resolves.toBe(false);
    });

    it('salts each hash so the same password never hashes alike', async () => {
        const [first, second] = await Promise.all([
            hashPassword('same'),
            hashPassword('same')
        ]);

        expect(first).not.toBe(second);
    });

    it('returns false for a malformed stored hash', async () => {
        await expect(verifyPassword('sup3rsecret', 'garbage')).resolves.toBe(
            false
        );
    });
});

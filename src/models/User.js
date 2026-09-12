/**
 * User shape defined by CONTRACT.md:
 * {
 *   id: string,
 *   name: string,
 *   email: string,
 *   passwordHash: string,
 *   preferences: object,
 *   createdAt: string (ISO date)
 * }
 */

// Strips passwordHash so it can never leak through a response.
const toPublicUser = ({ passwordHash, ...user }) => user;

module.exports = { toPublicUser };

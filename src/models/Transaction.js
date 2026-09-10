/**
 * Creates a transaction data object.
 *
 * Shape:
 * {
 *   id: string,
 *   userId: string,
 *   type: 'income' | 'expense',
 *   category: string,
 *   amount: number,
 *   date: string (YYYY-MM-DD),
 *   createdAt: string (ISO date)
 * }
 */

const createTransactionData = ({
  userId,
  type,
  category,
  amount,
  date,
}) => ({
  userId: userId.trim(),
  type,
  category: category.trim(),
  amount: Number(amount),
  date,
  createdAt: new Date().toISOString(),
});

module.exports = {
  createTransactionData,
};
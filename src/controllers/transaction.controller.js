const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/response');
const NotFoundError = require('../utils/errors/NotFoundError');

const {
  createTransactionData,
} = require('../models/Transaction');

const transactionService = require('../services/transaction.service');

const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getAllTransactions();

  return success(res, transactions);
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(
    req.params.id
  );

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  return success(res, transaction);
});

const createTransaction = asyncHandler(async (req, res) => {
  const transactionData = createTransactionData(req.body);

  const transaction = await transactionService.createTransaction(
    transactionData
  );

  return success(res, transaction, 201);
});

const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.updateTransaction(
    req.params.id,
    req.body
  );

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  return success(res, transaction);
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const removed = await transactionService.deleteTransaction(
    req.params.id
  );

  if (!removed) {
    throw new NotFoundError('Transaction not found');
  }

  return success(res, {
    message: 'Transaction deleted successfully',
  });
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
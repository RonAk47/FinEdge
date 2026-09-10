const transactionRepository = require('./transaction.repository');

const getAllTransactions = async () => {
  return transactionRepository.getAll();
};

const getTransactionById = async (id) => {
  return transactionRepository.getById(id);
};

const createTransaction = async (data) => {
  return transactionRepository.create(data);
};

const updateTransaction = async (id, data) => {
  return transactionRepository.update(id, data);
};

const deleteTransaction = async (id) => {
  return transactionRepository.remove(id);
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
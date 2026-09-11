const transactionRepository = require('./transaction.repository');
const { invalidateSummaryCache } = require('./summary.service');

const getAllTransactions = async (userId) => {
    const transactions = await transactionRepository.getAll();
    return transactions.filter((transaction) => transaction.userId === userId);
};

const getTransactionById = async (id, userId) => {
    const transaction = await transactionRepository.getById(id);
    return transaction && transaction.userId === userId ? transaction : null;
};

const createTransaction = async (data) => {
    const transaction = await transactionRepository.create(data);
    invalidateSummaryCache();
    return transaction;
};

const updateTransaction = async (id, data, userId) => {
    const existing = await getTransactionById(id, userId);
    if (!existing) return null;

    const transaction = await transactionRepository.update(id, {
        ...data,
        userId
    });
    if (transaction) invalidateSummaryCache();
    return transaction;
};

const deleteTransaction = async (id, userId) => {
    const existing = await getTransactionById(id, userId);
    if (!existing) return false;

    const removed = await transactionRepository.remove(id);
    if (removed) invalidateSummaryCache();
    return removed;
};

module.exports = {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
};

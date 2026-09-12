const express = require('express');
const requireAuth = require('../middleware/auth');

const {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transaction.controller');

const {
    validateCreateTransaction,
    validateUpdateTransaction
} = require('../middleware/validateTransaction');

const router = express.Router();

router.use(requireAuth);

router.get('/', getTransactions);

router.get('/:id', getTransaction);

router.post('/', validateCreateTransaction, createTransaction);

router.patch('/:id', validateUpdateTransaction, updateTransaction);

router.delete('/:id', deleteTransaction);

module.exports = router;

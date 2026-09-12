const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));

router.use('/users', require('./user.routes'));
router.use('/transactions', require('./transaction.routes'));
router.use('/summary', require('./summary.routes'));
router.use('/budgets', require('./budget.routes'));

module.exports = router;

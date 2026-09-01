const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));

// --- Add your router below as you build it. One line each keeps merge
// conflicts here to a minimum. Uncomment when your file exists. ---
// router.use('/users', require('./user.routes'));         // Person 1
// router.use('/transactions', require('./transaction.routes')); // Person 2
// router.use('/summary', require('./summary.routes'));     // Person 4
// router.use('/budgets', require('./budget.routes'));      // Person 4

module.exports = router;

const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));

// --- Add your router below as you build it. One line each keeps merge
// conflicts here to a minimum. Uncomment when your file exists. ---
router.use('/users', require('./user.routes'));            // Ahsas
// router.use('/transactions', require('./transaction.routes')); // Shiva
// router.use('/summary', require('./summary.routes'));     // Bhuvnesh
// router.use('/budgets', require('./budget.routes'));      // Bhuvnesh

module.exports = router;

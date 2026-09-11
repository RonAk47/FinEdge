const express = require('express');
const requireAuth = require('../middleware/auth');
const budgetController = require('../controllers/budget.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', budgetController.getBudgets);
router.get('/:id', budgetController.getBudget);
router.post('/', budgetController.createBudget);
router.patch('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;

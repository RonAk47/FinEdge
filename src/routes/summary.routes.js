const express = require('express');
const requireAuth = require('../middleware/auth');
const summaryController = require('../controllers/summary.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', summaryController.getSummary);

module.exports = router;

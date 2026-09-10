const express = require('express');
const requireAuth = require('../middleware/auth');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.post('/', userController.register);
router.post('/login', userController.login);
router.get('/me', requireAuth, userController.getCurrentUser);

module.exports = router;

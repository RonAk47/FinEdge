const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/response');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    success(res, { status: 'ok', uptime: process.uptime() });
  })
);

module.exports = router;

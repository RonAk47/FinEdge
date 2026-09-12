const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/response');
const summaryService = require('../services/summary.service');

const getSummary = asyncHandler(async (req, res) => {
    success(res, await summaryService.getSummary(req.query, req.user.id));
});

module.exports = { getSummary };

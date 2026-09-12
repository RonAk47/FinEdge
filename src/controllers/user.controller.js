const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/response');
const userService = require('../services/user.service');

const register = asyncHandler(async (req, res) => {
  success(res, await userService.registerUser(req.body), 201);
});

const login = asyncHandler(async (req, res) => {
  success(res, await userService.loginUser(req.body));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  success(res, await userService.getUserById(req.user.id));
});

module.exports = { register, login, getCurrentUser };

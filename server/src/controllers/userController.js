const asyncHandler = require('../middleware/asyncHandler');
const userService = require('../services/userService');
const { sendResponse } = require('../utils/response');

const getUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers(req.query);
    return sendResponse(res, { data: users });
});

const getUser = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(Number(req.params.id));
    return sendResponse(res, { data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(Number(req.params.id), req.body);
    return sendResponse(res, { message: 'Profile updated', data: user });
});

const updateAvailability = asyncHandler(async (req, res) => {
    const user = await userService.updateAvailability(Number(req.params.id), req.body.availability);
    return sendResponse(res, { message: 'Availability updated', data: user });
});

const updateSkills = asyncHandler(async (req, res) => {
    const user = await userService.updateSkills(Number(req.params.id), req.body.skills);
    return sendResponse(res, { message: 'Skills updated', data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
    await userService.deleteUser(Number(req.params.id));
    return sendResponse(res, { message: 'User deleted' });
});

module.exports = {
    getUsers,
    getUser,
    updateProfile,
    updateAvailability,
    updateSkills,
    deleteUser
};


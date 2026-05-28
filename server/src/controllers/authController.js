const asyncHandler = require('../middleware/asyncHandler');
const authService = require('../services/authService');

const signup = asyncHandler(async (req, res) => {
    const user = await authService.signup(req.body);

    res.status(201).json({
        success: true,
        message: 'User created successfully',
        user
    });
});

const login = asyncHandler(async (req, res) => {
    const { token, refreshToken, user } = await authService.login(req.body);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        refreshToken,
        user
    });
});

const refreshToken = asyncHandler(async (req, res) => {
    const { token, refreshToken: newRefreshToken, user } = await authService.refreshToken(req.body.refresh_token);
    res.status(200).json({
        success: true,
        message: 'Token refreshed',
        token,
        refreshToken: newRefreshToken,
        user
    });
});

const logout = asyncHandler(async (req, res) => {
    await authService.logout(req.body.refresh_token, req.user?.id);
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

module.exports = {
    signup,
    login,
    refreshToken,
    logout
};
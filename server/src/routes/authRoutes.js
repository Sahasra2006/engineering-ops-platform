const express = require('express');
const router = express.Router();

const {
    signup,
    login,
    refreshToken,
    logout
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

router.post('/signup', requireBodyFields(['full_name', 'email', 'password', 'role']), signup);
router.post('/login', requireBodyFields(['email', 'password']), login);
router.post('/refresh-token', requireBodyFields(['refresh_token']), refreshToken);
router.post('/logout', requireAuth, logout);

module.exports = router;
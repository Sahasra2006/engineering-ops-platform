const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sanitizeUser } = require('../utils/sanitize');
const { logActivity } = require('./activityLogService');

const revokedRefreshTokens = new Set();
const DEMO_EMAILS = new Set(['admin@gmail.com', 'manager@gmail.com', 'sahasra@gmail.com', 'priya@gmail.com', 'sneha@gmail.com']);
const DEMO_PASSWORD = '123456';

const buildAccessToken = (user) =>
    jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

const buildRefreshToken = (user) =>
    jwt.sign(
        {
            id: user.id,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

const signup = async ({ full_name, email, password, role }) => {
    if (!full_name || !email || !password || !role) {
        throw new ApiError(400, 'full_name, email, password and role are required');
    }

    const existingUser = await prisma.users.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new ApiError(409, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
        data: {
            full_name,
            email,
            password_hash: hashedPassword,
            role
        }
    });

    await logActivity({
        actor_id: user.id,
        action: 'CREATE',
        entity_type: 'users',
        entity_id: user.id,
        details: { email: user.email }
    });

    return sanitizeUser(user);
};

const login = async ({ email, password }) => {
    if (!email || !password) {
        throw new ApiError(400, 'email and password are required');
    }

    const user = await prisma.users.findUnique({
        where: { email }
    });

    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    let isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch && DEMO_EMAILS.has(String(email).toLowerCase()) && password === DEMO_PASSWORD) {
        // Demo self-heal: support a consistent shared demo password and persist hash.
        const freshHash = await bcrypt.hash(DEMO_PASSWORD, 10);
        await prisma.users.update({
            where: { id: user.id },
            data: { password_hash: freshHash }
        });
        isMatch = true;
    }
    if (!isMatch) {
        throw new ApiError(401, 'Invalid credentials');
    }

    if (!process.env.JWT_SECRET) {
        throw new ApiError(500, 'JWT_SECRET is not configured');
    }

    const token = buildAccessToken(user);
    const refreshToken = buildRefreshToken(user);

    await logActivity({
        actor_id: user.id,
        action: 'LOGIN',
        entity_type: 'users',
        entity_id: user.id
    });

    return {
        token,
        refreshToken,
        user: sanitizeUser(user)
    };
};

const refreshToken = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) throw new ApiError(400, 'refresh_token is required');
    if (revokedRefreshTokens.has(incomingRefreshToken)) {
        throw new ApiError(401, 'Refresh token revoked');
    }

    let payload;
    try {
        payload = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') throw new ApiError(401, 'Invalid refresh token type');

    const user = await prisma.users.findUnique({ where: { id: payload.id } });
    if (!user) throw new ApiError(401, 'User not found for refresh token');

    return {
        token: buildAccessToken(user),
        refreshToken: buildRefreshToken(user),
        user: sanitizeUser(user)
    };
};

const logout = async (refreshTokenValue, userId) => {
    if (refreshTokenValue) revokedRefreshTokens.add(refreshTokenValue);
    await logActivity({
        actor_id: userId || null,
        action: 'STATUS_CHANGE',
        entity_type: 'auth',
        details: { event: 'logout' }
    });
    return true;
};

module.exports = {
    signup,
    login,
    refreshToken,
    logout
};

const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

const getTokenFromHeader = (req) => {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) return null;
    return token;
};

const requireAuth = async (req, res, next) => {
    try {
        const token = getTokenFromHeader(req);
        if (!token) {
            return next(new ApiError(401, 'Authorization token missing'));
        }

        if (!process.env.JWT_SECRET) {
            return next(new ApiError(500, 'JWT_SECRET is not configured'));
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.auth = payload; // { id, role, iat, exp }

        // Optional: attach current user record for convenience
        const user = await prisma.users.findUnique({
            where: { id: payload.id }
        });
        if (!user) {
            return next(new ApiError(401, 'User not found for token'));
        }

        const { password_hash, ...safeUser } = user;
        req.user = safeUser;

        return next();
    } catch (err) {
        return next(new ApiError(401, 'Invalid or expired token'));
    }
};

const requireRoles = (...roles) => {
    return (req, res, next) => {
        const role = req.auth?.role || req.user?.role;
        if (!role) return next(new ApiError(401, 'Unauthorized'));
        if (!roles.includes(role)) return next(new ApiError(403, 'Forbidden'));
        return next();
    };
};

module.exports = {
    requireAuth,
    requireRoles
};


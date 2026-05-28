const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { getPagination, getSort } = require('../utils/query');
const { sanitizeUser, sanitizeUsers } = require('../utils/sanitize');
const { logActivity } = require('./activityLogService');

const getAllUsers = async (query) => {
    const { page, limit, skip } = getPagination(query);
    const orderBy = getSort(query, ['id', 'full_name', 'email', 'created_at', 'updated_at']);
    const where = {};

    if (query.search) {
        where.OR = [
            { full_name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { designation: { contains: query.search, mode: 'insensitive' } }
        ];
    }
    if (query.role) where.role = query.role;
    if (query.team_id) where.team_id = Number(query.team_id);
    if (query.availability) where.availability = query.availability;

    const [total, users] = await Promise.all([
        prisma.users.count({ where }),
        prisma.users.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: { teams: true }
        })
    ]);

    return {
        items: sanitizeUsers(users),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
    };
};

const getUserById = async (id) => {
    const user = await prisma.users.findUnique({
        where: { id },
        include: { teams: true }
    });
    if (!user) throw new ApiError(404, 'User not found');
    return sanitizeUser(user);
};

const updateProfile = async (id, payload) => {
    const { full_name, designation, avatar } = payload;
    const user = await prisma.users.update({
        where: { id },
        data: {
            ...(full_name !== undefined ? { full_name } : {}),
            ...(designation !== undefined ? { designation } : {}),
            ...(avatar !== undefined ? { avatar } : {}),
            updated_at: new Date()
        }
    });
    await logActivity({ actor_id: id, action: 'UPDATE', entity_type: 'users', entity_id: id, details: { type: 'profile' } });
    return sanitizeUser(user);
};

const updateAvailability = async (id, availability) => {
    if (!availability) throw new ApiError(400, 'availability is required');
    const user = await prisma.users.update({
        where: { id },
        data: { availability, updated_at: new Date() }
    });
    await logActivity({ actor_id: id, action: 'STATUS_CHANGE', entity_type: 'users', entity_id: id, details: { availability } });
    return sanitizeUser(user);
};

const updateSkills = async (id, skills) => {
    if (skills === undefined) throw new ApiError(400, 'skills is required');
    const user = await prisma.users.update({
        where: { id },
        data: { skills: Array.isArray(skills) ? skills.join(', ') : skills, updated_at: new Date() }
    });
    await logActivity({ actor_id: id, action: 'UPDATE', entity_type: 'users', entity_id: id, details: { type: 'skills' } });
    return sanitizeUser(user);
};

const deleteUser = async (id) => {
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'User not found');
    await prisma.users.delete({ where: { id } });
    await logActivity({ actor_id: id, action: 'DELETE', entity_type: 'users', entity_id: id });
    return true;
};

module.exports = {
    getAllUsers,
    getUserById,
    updateProfile,
    updateAvailability,
    updateSkills,
    deleteUser
};


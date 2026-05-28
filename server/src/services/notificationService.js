const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const createNotification = async ({ message, type, user_id }) => {
    if (!message) throw new ApiError(400, 'message is required');
    if (!user_id) throw new ApiError(400, 'user_id is required');

    const user = await prisma.users.findUnique({ where: { id: Number(user_id) } });
    if (!user) throw new ApiError(404, 'User not found');

    return prisma.notifications.create({
        data: {
            message,
            type: type || undefined,
            user_id: Number(user_id)
        }
    });
};

const getMyNotifications = async (userId) => {
    return prisma.notifications.findMany({
        where: { user_id: userId },
        orderBy: { id: 'desc' }
    });
};

const markRead = async (id, userId) => {
    const notif = await prisma.notifications.findUnique({ where: { id } });
    if (!notif) throw new ApiError(404, 'Notification not found');
    if (notif.user_id !== userId) throw new ApiError(403, 'Forbidden');

    return prisma.notifications.update({
        where: { id },
        data: { is_read: true }
    });
};

const getUnreadCount = async (userId) => {
    const count = await prisma.notifications.count({
        where: { user_id: userId, is_read: false }
    });
    return { unread_count: count };
};

const getAllNotifications = async (query = {}) => {
    const where = {};
    if (query.user_id) where.user_id = Number(query.user_id);
    if (query.is_read !== undefined) where.is_read = query.is_read === 'true' || query.is_read === true;
    if (query.type) where.type = query.type;

    return prisma.notifications.findMany({
        where,
        orderBy: { id: 'desc' }
    });
};

const deleteNotification = async (id, actorUserId, actorRole) => {
    const notif = await prisma.notifications.findUnique({ where: { id } });
    if (!notif) throw new ApiError(404, 'Notification not found');
    if (notif.user_id !== actorUserId && !['ADMIN', 'MANAGER'].includes(actorRole)) {
        throw new ApiError(403, 'Forbidden');
    }
    await prisma.notifications.delete({ where: { id } });
    return true;
};

module.exports = {
    createNotification,
    getMyNotifications,
    markRead,
    getUnreadCount,
    getAllNotifications,
    deleteNotification
};


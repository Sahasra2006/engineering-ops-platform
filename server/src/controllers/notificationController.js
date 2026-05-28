const asyncHandler = require('../middleware/asyncHandler');
const notificationService = require('../services/notificationService');
const { sendResponse } = require('../utils/response');

const createNotification = asyncHandler(async (req, res) => {
    const notification = await notificationService.createNotification(req.body);
    return sendResponse(res, { statusCode: 201, message: 'Notification created', data: notification });
});

const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await notificationService.getMyNotifications(req.user.id);
    return sendResponse(res, { statusCode: 200, data: notifications });
});

const markRead = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const notification = await notificationService.markRead(id, req.user.id);
    return sendResponse(res, { statusCode: 200, message: 'Notification marked as read', data: notification });
});

const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id);
    return sendResponse(res, { statusCode: 200, data: count });
});

const getAllNotifications = asyncHandler(async (req, res) => {
    const notifications = await notificationService.getAllNotifications(req.query);
    return sendResponse(res, { statusCode: 200, data: notifications });
});

const deleteNotification = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await notificationService.deleteNotification(id, req.user.id, req.user.role);
    return sendResponse(res, { statusCode: 200, message: 'Notification deleted' });
});

module.exports = {
    createNotification,
    getMyNotifications,
    markRead,
    getUnreadCount,
    getAllNotifications,
    deleteNotification
};


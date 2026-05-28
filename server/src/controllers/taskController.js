const asyncHandler = require('../middleware/asyncHandler');
const taskService = require('../services/taskService');
const { sendResponse } = require('../utils/response');

const createTask = asyncHandler(async (req, res) => {
    const task = await taskService.createTask(req.body, req.user.id);
    return sendResponse(res, { statusCode: 201, message: 'Task created', data: task });
});

const assignTask = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const userId = Number(req.body.user_id);
    const task = await taskService.assignTask(id, userId);
    return sendResponse(res, { statusCode: 200, message: 'Task assigned', data: task });
});

const updateStatus = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const task = await taskService.updateTaskStatus(id, req.body.status);
    return sendResponse(res, { statusCode: 200, message: 'Task status updated', data: task });
});

const updatePriority = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const task = await taskService.updateTaskPriority(id, req.body.priority);
    return sendResponse(res, { statusCode: 200, message: 'Task priority updated', data: task });
});

const fetchTasks = asyncHandler(async (req, res) => {
    const tasks = await taskService.fetchTasks(req.query);
    return sendResponse(res, { statusCode: 200, data: tasks });
});

const addComment = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const comment = await taskService.addTaskComment(id, req.body.content, req.user.id);
    return sendResponse(res, { statusCode: 201, message: 'Comment added', data: comment });
});

const getComments = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const comments = await taskService.getTaskComments(id);
    return sendResponse(res, { statusCode: 200, data: comments });
});

const getAnalytics = asyncHandler(async (req, res) => {
    const analytics = await taskService.getTaskAnalytics();
    return sendResponse(res, { statusCode: 200, data: analytics });
});

const getOverdue = asyncHandler(async (req, res) => {
    const tasks = await taskService.getOverdueTasks();
    return sendResponse(res, { statusCode: 200, data: tasks });
});

const getWorkload = asyncHandler(async (req, res) => {
    const workload = await taskService.getUserWorkload();
    return sendResponse(res, { statusCode: 200, data: workload });
});

const getTask = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const task = await taskService.getTaskById(id);
    return sendResponse(res, { statusCode: 200, data: task });
});

const updateTask = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const task = await taskService.updateTask(id, req.body);
    return sendResponse(res, { statusCode: 200, message: 'Task updated', data: task });
});

const deleteTask = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await taskService.deleteTask(id);
    return sendResponse(res, { statusCode: 200, message: 'Task deleted' });
});

module.exports = {
    createTask,
    assignTask,
    updateStatus,
    updatePriority,
    fetchTasks,
    addComment,
    getComments,
    getAnalytics,
    getOverdue,
    getWorkload,
    getTask,
    updateTask,
    deleteTask
};


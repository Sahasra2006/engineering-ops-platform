const asyncHandler = require('../middleware/asyncHandler');
const sprintService = require('../services/sprintService');
const { sendResponse } = require('../utils/response');

const createSprint = asyncHandler(async (req, res) => {
    const sprint = await sprintService.createSprint(req.body);
    return sendResponse(res, { statusCode: 201, message: 'Sprint created', data: sprint });
});

const updateSprint = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const sprint = await sprintService.updateSprint(id, req.body);
    return sendResponse(res, { statusCode: 200, message: 'Sprint updated', data: sprint });
});

const getSprintTasks = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const tasks = await sprintService.getSprintTasks(id);
    return sendResponse(res, { statusCode: 200, data: tasks });
});

const completeSprint = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const sprint = await sprintService.completeSprint(id);
    return sendResponse(res, { statusCode: 200, message: 'Sprint completed', data: sprint });
});

const moveTask = asyncHandler(async (req, res) => {
    const taskId = Number(req.params.taskId);
    const toSprintId = Number(req.body.to_sprint_id);
    const task = await sprintService.moveTaskBetweenSprints(taskId, toSprintId);
    return sendResponse(res, { statusCode: 200, message: 'Task moved', data: task });
});

const getAnalytics = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const analytics = await sprintService.getSprintAnalytics(id);
    return sendResponse(res, { statusCode: 200, data: analytics });
});

const getAllSprints = asyncHandler(async (req, res) => {
    const sprints = await sprintService.getAllSprints(req.query);
    return sendResponse(res, { statusCode: 200, data: sprints });
});

const getSprint = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const sprint = await sprintService.getSprintById(id);
    return sendResponse(res, { statusCode: 200, data: sprint });
});

const deleteSprint = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await sprintService.deleteSprint(id);
    return sendResponse(res, { statusCode: 200, message: 'Sprint deleted' });
});

module.exports = {
    createSprint,
    updateSprint,
    getSprintTasks,
    completeSprint,
    moveTask,
    getAnalytics,
    getAllSprints,
    getSprint,
    deleteSprint
};


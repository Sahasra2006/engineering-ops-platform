const asyncHandler = require('../middleware/asyncHandler');
const dashboardService = require('../services/dashboardService');
const { sendResponse } = require('../utils/response');

const getOverview = asyncHandler(async (req, res) => {
    const data = await dashboardService.getOverview();
    return sendResponse(res, { data });
});

const getProductivity = asyncHandler(async (req, res) => {
    const data = await dashboardService.getProductivityMetrics();
    return sendResponse(res, { data });
});

const getWorkload = asyncHandler(async (req, res) => {
    const data = await dashboardService.getWorkloadAnalytics();
    return sendResponse(res, { data });
});

const getProjectStats = asyncHandler(async (req, res) => {
    const data = await dashboardService.getProjectAnalytics();
    return sendResponse(res, { data });
});

const getSprintStats = asyncHandler(async (req, res) => {
    const sprintId = Number(req.query.sprint_id);
    const data = await dashboardService.getSprintAnalytics({ sprintId: sprintId || undefined });
    return sendResponse(res, { data });
});

module.exports = {
    getOverview,
    getProductivity,
    getWorkload,
    getProjectStats,
    getSprintStats
};


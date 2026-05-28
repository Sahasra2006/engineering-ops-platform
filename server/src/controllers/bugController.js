const asyncHandler = require('../middleware/asyncHandler');
const bugService = require('../services/bugService');
const { sendResponse } = require('../utils/response');

const reportBug = asyncHandler(async (req, res) => {
    const bug = await bugService.reportBug(req.body, req.user.id);
    return sendResponse(res, { statusCode: 201, message: 'Bug reported', data: bug });
});

const assignBug = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const userId = Number(req.body.user_id);
    const bug = await bugService.assignBug(id, userId);
    return sendResponse(res, { statusCode: 200, message: 'Bug assigned', data: bug });
});

const updateStatus = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const bug = await bugService.updateBugStatus(id, req.body.status);
    return sendResponse(res, { statusCode: 200, message: 'Bug status updated', data: bug });
});

const updateSeverity = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const bug = await bugService.updateBugSeverity(id, req.body.severity);
    return sendResponse(res, { statusCode: 200, message: 'Bug severity updated', data: bug });
});

const fetchBugs = asyncHandler(async (req, res) => {
    const bugs = await bugService.fetchBugs(req.query);
    return sendResponse(res, { statusCode: 200, data: bugs });
});

const reopenBug = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const bug = await bugService.reopenBug(id);
    return sendResponse(res, { statusCode: 200, message: 'Bug reopened', data: bug });
});

const getAnalytics = asyncHandler(async (req, res) => {
    const analytics = await bugService.getBugAnalytics();
    return sendResponse(res, { statusCode: 200, data: analytics });
});

const getBug = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const bug = await bugService.getBugById(id);
    return sendResponse(res, { statusCode: 200, data: bug });
});

const updateBug = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const bug = await bugService.updateBug(id, req.body);
    return sendResponse(res, { statusCode: 200, message: 'Bug updated', data: bug });
});

const deleteBug = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await bugService.deleteBug(id);
    return sendResponse(res, { statusCode: 200, message: 'Bug deleted' });
});

module.exports = {
    reportBug,
    assignBug,
    updateStatus,
    updateSeverity,
    fetchBugs,
    reopenBug,
    getAnalytics,
    getBug,
    updateBug,
    deleteBug
};


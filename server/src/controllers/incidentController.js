const asyncHandler = require('../middleware/asyncHandler');
const incidentService = require('../services/incidentService');
const { sendResponse } = require('../utils/response');

const createIncident = asyncHandler(async (req, res) => {
    const incident = await incidentService.createIncident(req.body, req.user.id);
    return sendResponse(res, { statusCode: 201, message: 'Incident created', data: incident });
});

const updateIncident = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const incident = await incidentService.updateIncident(id, req.body, req.user);
    return sendResponse(res, { statusCode: 200, message: 'Incident updated', data: incident });
});

const resolveIncident = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const incident = await incidentService.resolveIncident(id);
    return sendResponse(res, { statusCode: 200, message: 'Incident resolved', data: incident });
});

const fetchIncidents = asyncHandler(async (req, res) => {
    const incidents = await incidentService.fetchIncidents(req.query);
    return sendResponse(res, { statusCode: 200, data: incidents });
});

const assignIncident = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const userId = Number(req.body.user_id);
    const incident = await incidentService.assignIncident(id, userId);
    return sendResponse(res, { statusCode: 200, message: 'Incident assigned', data: incident });
});

const getTimeline = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const timeline = await incidentService.getIncidentTimeline(id);
    return sendResponse(res, { statusCode: 200, data: timeline });
});

const getAnalytics = asyncHandler(async (req, res) => {
    const analytics = await incidentService.getIncidentAnalytics();
    return sendResponse(res, { statusCode: 200, data: analytics });
});

const getIncident = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const incident = await incidentService.getIncidentById(id);
    return sendResponse(res, { statusCode: 200, data: incident });
});

const deleteIncident = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await incidentService.deleteIncident(id);
    return sendResponse(res, { statusCode: 200, message: 'Incident deleted' });
});

module.exports = {
    createIncident,
    updateIncident,
    resolveIncident,
    fetchIncidents,
    assignIncident,
    getTimeline,
    getAnalytics,
    getIncident,
    deleteIncident
};


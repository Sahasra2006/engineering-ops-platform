const asyncHandler = require('../middleware/asyncHandler');
const projectService = require('../services/projectService');
const { sendResponse } = require('../utils/response');

const createProject = asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.body, req.user.id);
    return sendResponse(res, { statusCode: 201, message: 'Project created', data: project });
});

const getAllProjects = asyncHandler(async (req, res) => {
    const projects = await projectService.getAllProjects();
    return sendResponse(res, { statusCode: 200, data: projects });
});

const getProject = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const project = await projectService.getProjectById(id);
    return sendResponse(res, { statusCode: 200, data: project });
});

const deleteProject = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await projectService.deleteProject(id);
    return sendResponse(res, { statusCode: 200, message: 'Project deleted' });
});

const updateProjectStatus = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const project = await projectService.updateProjectStatus(id, req.body.status);
    return sendResponse(res, { statusCode: 200, message: 'Project status updated', data: project });
});

const assignMembers = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const members = await projectService.assignProjectMembers(id, req.body.user_ids);
    return sendResponse(res, { statusCode: 200, message: 'Project members assigned', data: members });
});

const removeMember = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const userId = Number(req.params.userId);
    await projectService.removeProjectMember(id, userId);
    return sendResponse(res, { statusCode: 200, message: 'Project member removed' });
});

const getMembers = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const members = await projectService.getProjectMembers(id);
    return sendResponse(res, { statusCode: 200, data: members });
});

const getAnalytics = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const analytics = await projectService.getProjectAnalytics(id);
    return sendResponse(res, { statusCode: 200, data: analytics });
});

const getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await projectService.getProjectDashboard();
    return sendResponse(res, { statusCode: 200, data: dashboard });
});

const updateProject = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const project = await projectService.updateProject(id, req.body);
    return sendResponse(res, { statusCode: 200, message: 'Project updated', data: project });
});

module.exports = {
    createProject,
    getAllProjects,
    getProject,
    deleteProject,
    updateProjectStatus,
    assignMembers,
    removeMember,
    getMembers,
    getAnalytics,
    getDashboard,
    updateProject
};


const asyncHandler = require('../middleware/asyncHandler');
const teamService = require('../services/teamService');
const { sendResponse } = require('../utils/response');

const createTeam = asyncHandler(async (req, res) => {
    const team = await teamService.createTeam(req.body, req.user);
    return sendResponse(res, { statusCode: 201, message: 'Team created', data: team });
});

const getAllTeams = asyncHandler(async (req, res) => {
    const teams = await teamService.getAllTeams(req.user);
    return sendResponse(res, { statusCode: 200, data: teams });
});

const getTeam = asyncHandler(async (req, res) => {
    const teamId = Number(req.params.id);
    const team = await teamService.getTeamById(teamId);
    return sendResponse(res, { statusCode: 200, data: team });
});

const updateTeam = asyncHandler(async (req, res) => {
    const teamId = Number(req.params.id);
    const team = await teamService.updateTeam(teamId, req.body);
    return sendResponse(res, { statusCode: 200, message: 'Team updated', data: team });
});

const deleteTeam = asyncHandler(async (req, res) => {
    const teamId = Number(req.params.id);
    await teamService.deleteTeam(teamId);
    return sendResponse(res, { statusCode: 200, message: 'Team deleted' });
});

const addUserToTeam = asyncHandler(async (req, res) => {
    const teamId = Number(req.params.id);
    const userId = Number(req.body.user_id);
    const user = await teamService.addUserToTeam({ teamId, userId });
    return sendResponse(res, { statusCode: 200, message: 'User added to team', data: user });
});

const removeUserFromTeam = asyncHandler(async (req, res) => {
    const teamId = Number(req.params.id);
    const userId = Number(req.params.userId);
    const user = await teamService.removeUserFromTeam({ teamId, userId });
    return sendResponse(res, { statusCode: 200, message: 'User removed from team', data: user });
});

const getTeamMembers = asyncHandler(async (req, res) => {
    const teamId = Number(req.params.id);
    const members = await teamService.getTeamMembers(teamId);
    return sendResponse(res, { statusCode: 200, data: members });
});

const getTeamStats = asyncHandler(async (req, res) => {
    const teamId = Number(req.params.id);
    const stats = await teamService.getTeamStats(teamId);
    return sendResponse(res, { statusCode: 200, data: stats });
});

const updateTeamLead = asyncHandler(async (req, res) => {
    const teamId = Number(req.params.id);
    const userId = Number(req.body.user_id);
    const lead = await teamService.updateTeamLead({ teamId, userId });
    return sendResponse(res, { statusCode: 200, message: 'Team lead updated', data: lead });
});

module.exports = {
    createTeam,
    getAllTeams,
    getTeam,
    updateTeam,
    deleteTeam,
    addUserToTeam,
    removeUserFromTeam,
    getTeamMembers,
    getTeamStats,
    updateTeamLead
};


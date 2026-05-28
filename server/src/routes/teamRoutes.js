const express = require('express');
const router = express.Router();

const teamController = require('../controllers/teamController');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

// Teams
router.post('/', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['name']), teamController.createTeam);
router.get('/', requireAuth, teamController.getAllTeams);
router.get('/:id', requireAuth, teamController.getTeam);
router.put('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), teamController.updateTeam);
router.delete('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), teamController.deleteTeam);

// Add user to team
router.post('/:id/users', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['user_id']), teamController.addUserToTeam);
router.delete('/:id/users/:userId', requireAuth, requireRoles('ADMIN', 'MANAGER'), teamController.removeUserFromTeam);
router.get('/:id/members', requireAuth, teamController.getTeamMembers);
router.get('/:id/stats', requireAuth, teamController.getTeamStats);
router.patch('/:id/lead', requireAuth, requireRoles('ADMIN'), requireBodyFields(['user_id']), teamController.updateTeamLead);

module.exports = router;


const express = require('express');
const router = express.Router();

const projectController = require('../controllers/projectController');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

router.get('/dashboard/summary', requireAuth, projectController.getDashboard);
router.post('/', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['title']), projectController.createProject);
router.get('/', requireAuth, projectController.getAllProjects);
router.get('/:id', requireAuth, projectController.getProject);
router.delete('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), projectController.deleteProject);
router.put('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), projectController.updateProject);

router.patch('/:id/status', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['status']), projectController.updateProjectStatus);
router.post('/:id/members', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['user_ids']), projectController.assignMembers);
router.delete('/:id/members/:userId', requireAuth, requireRoles('ADMIN', 'MANAGER'), projectController.removeMember);
router.get('/:id/members', requireAuth, projectController.getMembers);
router.get('/:id/analytics', requireAuth, projectController.getAnalytics);

module.exports = router;


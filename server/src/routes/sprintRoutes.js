const express = require('express');
const router = express.Router();

const sprintController = require('../controllers/sprintController');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

router.get('/', requireAuth, sprintController.getAllSprints);
router.post('/', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['name', 'project_id']), sprintController.createSprint);
router.put('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), sprintController.updateSprint);
router.get('/:id', requireAuth, sprintController.getSprint);
router.delete('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), sprintController.deleteSprint);

router.get('/:id/tasks', requireAuth, sprintController.getSprintTasks);
router.post('/:id/complete', requireAuth, requireRoles('ADMIN', 'MANAGER'), sprintController.completeSprint);
router.post('/tasks/:taskId/move', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['to_sprint_id']), sprintController.moveTask);
router.get('/:id/analytics', requireAuth, sprintController.getAnalytics);

module.exports = router;


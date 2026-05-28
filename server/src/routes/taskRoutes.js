const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

router.post('/', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['title', 'due_date']), taskController.createTask);
router.get('/', requireAuth, taskController.fetchTasks);
router.get('/analytics/summary', requireAuth, taskController.getAnalytics);
router.get('/analytics/overdue', requireAuth, taskController.getOverdue);
router.get('/analytics/workload', requireAuth, requireRoles('ADMIN', 'MANAGER'), taskController.getWorkload);

router.post('/:id/assign', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['user_id']), taskController.assignTask);
router.patch('/:id/status', requireAuth, requireBodyFields(['status']), taskController.updateStatus);
router.patch('/:id/priority', requireAuth, requireBodyFields(['priority']), taskController.updatePriority);

router.post('/:id/comments', requireAuth, requireBodyFields(['content']), taskController.addComment);
router.get('/:id/comments', requireAuth, taskController.getComments);
router.get('/:id', requireAuth, taskController.getTask);
router.put('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), taskController.updateTask);
router.delete('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), taskController.deleteTask);

module.exports = router;


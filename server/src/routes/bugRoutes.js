const express = require('express');
const router = express.Router();

const bugController = require('../controllers/bugController');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

router.get('/analytics/summary', requireAuth, bugController.getAnalytics);
router.post('/', requireAuth, requireBodyFields(['title']), bugController.reportBug);
router.get('/', requireAuth, bugController.fetchBugs);
router.get('/:id', requireAuth, bugController.getBug);

router.post('/:id/assign', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['user_id']), bugController.assignBug);
router.patch('/:id/status', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['status']), bugController.updateStatus);
router.patch('/:id/severity', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['severity']), bugController.updateSeverity);
router.post('/:id/reopen', requireAuth, requireRoles('ADMIN', 'MANAGER'), bugController.reopenBug);
router.put('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), bugController.updateBug);
router.delete('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), bugController.deleteBug);

module.exports = router;


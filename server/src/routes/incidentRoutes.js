const express = require('express');
const router = express.Router();

const incidentController = require('../controllers/incidentController');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

router.get('/analytics/summary', requireAuth, incidentController.getAnalytics);
router.post('/', requireAuth, requireBodyFields(['title']), incidentController.createIncident);
router.get('/', requireAuth, incidentController.fetchIncidents);
router.get('/:id', requireAuth, incidentController.getIncident);
router.put('/:id', requireAuth, incidentController.updateIncident);
router.post('/:id/resolve', requireAuth, requireRoles('ADMIN', 'MANAGER'), incidentController.resolveIncident);
router.post('/:id/assign', requireAuth, requireRoles('ADMIN', 'MANAGER'), requireBodyFields(['user_id']), incidentController.assignIncident);
router.get('/:id/timeline', requireAuth, incidentController.getTimeline);
router.delete('/:id', requireAuth, requireRoles('ADMIN', 'MANAGER'), incidentController.deleteIncident);

module.exports = router;


const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requireRoles } = require('../middleware/auth');

router.get('/overview', requireAuth, dashboardController.getOverview);
router.get('/productivity', requireAuth, dashboardController.getProductivity);
router.get('/workload', requireAuth, requireRoles('ADMIN', 'MANAGER'), dashboardController.getWorkload);
router.get('/projects', requireAuth, dashboardController.getProjectStats);
router.get('/sprints', requireAuth, dashboardController.getSprintStats);

module.exports = router;


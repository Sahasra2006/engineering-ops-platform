const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

router.get('/', requireAuth, requireRoles('ADMIN', 'MANAGER'), userController.getUsers);
router.get('/:id', requireAuth, userController.getUser);
router.put('/:id/profile', requireAuth, userController.updateProfile);
router.patch('/:id/availability', requireAuth, requireBodyFields(['availability']), userController.updateAvailability);
router.patch('/:id/skills', requireAuth, requireBodyFields(['skills']), userController.updateSkills);
router.delete('/:id', requireAuth, requireRoles('ADMIN'), userController.deleteUser);

module.exports = router;


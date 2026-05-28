const express = require('express');
const router = express.Router();

const commentController = require('../controllers/commentController');
const { requireAuth } = require('../middleware/auth');
const { requireBodyFields } = require('../middleware/validate');

router.post('/', requireAuth, requireBodyFields(['content']), commentController.createComment);
router.get('/', requireAuth, commentController.getComments);
router.delete('/:id', requireAuth, commentController.deleteComment);

module.exports = router;


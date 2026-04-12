const express = require('express');
const router = express.Router();
const bulkMessageController = require('../controllers/BulkMessageController');
// const { authMiddleware } = require('../middleware/auth'); // COMMENTED OUT

router.get('/', bulkMessageController.getAll);
router.get('/:id', bulkMessageController.getById);
router.post('/', bulkMessageController.create);
router.post('/:id/send', bulkMessageController.send);
router.post('/:id/schedule', bulkMessageController.schedule);
router.get('/:id/recipients', bulkMessageController.getRecipients);
router.delete('/:id', bulkMessageController.delete);

module.exports = router;
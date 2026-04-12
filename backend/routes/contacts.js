const express = require('express');
const router = express.Router();
const contactController = require('../controllers/ContactController');
// const { authMiddleware } = require('../middleware/auth'); // COMMENTED OUT

router.get('/', contactController.getAll);
router.get('/stats', contactController.getStats);
router.get('/:id', contactController.getById);
router.post('/', contactController.create);
router.put('/:id', contactController.update);
router.delete('/:id', contactController.delete);
router.post('/:id/labels', contactController.addLabel);
router.delete('/:id/labels', contactController.removeLabel);
router.post('/import', contactController.bulkImport);

module.exports = router;
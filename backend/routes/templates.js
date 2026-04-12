const express = require('express');
const router = express.Router();
const templateController = require('../controllers/TemplateController');
// const { authMiddleware } = require('../middleware/auth'); // COMMENTED OUT

router.get('/', templateController.getAll);
router.get('/:id', templateController.getById);
router.post('/', templateController.create);
router.put('/:id', templateController.update);
router.delete('/:id', templateController.delete);
router.post('/:id/use', templateController.use);

module.exports = router;
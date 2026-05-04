const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentProcessor = require('../services/documentProcessor');
const kbService = require('../services/kbService');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/knowledge_base';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

// POST /api/knowledge-base/upload
router.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    for (const file of files) {
      try {
        const chunks = await documentProcessor.processDocument(file.path, file.originalname);
        const { documentId, chunksCount } = await kbService.saveDocument(file.originalname, file.path, chunks);
        
        results.push({
          filename: file.originalname,
          status: 'processed',
          chunksCount
        });
      } catch (err) {
        results.push({
          filename: file.originalname,
          status: 'failed',
          error: err.message
        });
      }
    }

    res.json({ success: true, files: results });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/knowledge-base/documents
router.get('/documents', async (req, res) => {
  try {
    const documents = await kbService.getDocuments();
    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/knowledge-base/documents/:filename
router.delete('/documents/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    await kbService.deleteDocument(filename);
    
    // Optionally delete physical file
    // const filePath = path.join('uploads/knowledge_base', filename);
    // if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

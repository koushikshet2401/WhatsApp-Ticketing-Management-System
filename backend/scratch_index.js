require('dotenv').config();
const documentProcessor = require('./services/documentProcessor');
const kbService = require('./services/kbService');
const fs = require('fs');
const path = require('path');

async function indexManualFiles() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));

  for (const filename of files) {
    const filePath = path.join(uploadsDir, filename);
    console.log(`📄 Processing ${filename}...`);
    try {
      const chunks = await documentProcessor.processDocument(filePath, filename);
      const result = await kbService.saveDocument(filename, filePath, chunks);
      console.log(`✅ Indexed ${filename}: ${result.chunksCount} chunks.`);
    } catch (err) {
      console.error(`❌ Failed to index ${filename}:`, err.message);
    }
  }
  process.exit();
}

indexManualFiles();

const fs = require('fs');
const { PDFParse: pdf } = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

class DocumentProcessor {
  async processDocument(filePath, filename) {
    const extension = path.extname(filename).toLowerCase();
    let text = '';

    if (extension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const uint8Array = new Uint8Array(dataBuffer);
      const doc = new pdf(uint8Array);
      await doc.load();
      const textObj = await doc.getText();
      text = textObj.text;
    } else if (extension === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (extension === '.txt' || extension === '.md') {
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from document');
    }

    // Basic chunking (e.g., 1000 characters with 200 overlap)
    const chunks = this.chunkText(text, 1000, 200);
    return chunks;
  }

  chunkText(text, chunkSize, overlap) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = start + chunkSize;
      chunks.push(text.substring(start, end));
      start += chunkSize - overlap;
    }

    return chunks;
  }
}

module.exports = new DocumentProcessor();

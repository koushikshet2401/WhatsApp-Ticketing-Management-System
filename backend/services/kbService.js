const { OpenAI } = require('openai');
const db = require('../config/database');

class KBService {
  get openai() {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your_key_here') {
      throw new Error('OpenAI API Key is missing or invalid. Please check your .env file.');
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async getEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " "),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Error generating embedding:', error);
      throw error;
    }
  }

  async search(queryText, limit = 5) {
    try {
      let queryEmbedding;
      try {
        queryEmbedding = await this.getEmbedding(queryText);
      } catch (e) {
        console.warn('⚠️ OpenAI Embedding failed, falling back to keyword search:', e.message);
      }

      // Fetch all chunks
      const [chunks] = await db.query('SELECT content, embedding FROM document_chunks');
      
      if (chunks.length === 0) return '';

      if (queryEmbedding) {
        // Calculate cosine similarity in memory
        const similarities = chunks.map(chunk => {
          const chunkEmbedding = JSON.parse(chunk.embedding);
          return {
            content: chunk.content,
            similarity: this.cosineSimilarity(queryEmbedding, chunkEmbedding)
          };
        });

        // Sort by similarity and take top K
        const topChunks = similarities
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);

        return topChunks.map(c => c.content).join('\n\n');
      } else {
        // Fallback: Keyword search
        const keywords = queryText.toLowerCase().replace(/[?.,!]/g, '').split(/\s+/).filter(kw => kw.length > 2);
        const keywordMatches = chunks.map(chunk => {
          const content = chunk.content.toLowerCase();
          const score = keywords.reduce((acc, kw) => acc + (content.includes(kw) ? 1 : 0), 0);
          return { content: chunk.content, score };
        });

        const topChunks = keywordMatches
          .filter(c => c.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);

        return topChunks.map(c => c.content).join('\n\n');
      }
    } catch (error) {
      console.error('❌ Error searching knowledge base:', error);
      return '';
    }
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async saveDocument(filename, filePath, chunks) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [docResult] = await connection.query(
        'INSERT INTO documents (filename, file_path) VALUES (?, ?)',
        [filename, filePath]
      );
      const documentId = docResult.insertId;

      for (const chunk of chunks) {
        let embedding = null;
        try {
          embedding = await this.getEmbedding(chunk);
        } catch (e) {
          console.warn(`⚠️ Embedding failed for chunk, saving without embedding: ${e.message}`);
        }
        
        await connection.query(
          'INSERT INTO document_chunks (document_id, content, embedding) VALUES (?, ?, ?)',
          [documentId, chunk, embedding ? JSON.stringify(embedding) : null]
        );
      }

      await connection.commit();
      return { documentId, chunksCount: chunks.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getDocuments() {
    const [docs] = await db.query(`
      SELECT 
        d.id, d.filename, d.uploaded_at, COUNT(c.id) as chunks_count
      FROM documents d
      LEFT JOIN document_chunks c ON d.id = c.document_id
      GROUP BY d.id
      ORDER BY d.uploaded_at DESC
    `);
    return docs;
  }

  async deleteDocument(filename) {
    await db.query('DELETE FROM documents WHERE filename = ?', [filename]);
  }
}

module.exports = new KBService();

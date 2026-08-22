// Lightweight in-app vector store utilities used for the RAG pipeline.
// Chunks raw notes into overlapping windows, then ranks chunks against a
// query using cosine similarity over embeddings.

function chunkText(text, chunkSize = 500, overlap = 80) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = end - overlap;
  }

  return chunks;
}

function cosineSimilarity(a, b) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function topKRelevantChunks(queryEmbedding, chunks, k = 3) {
  return chunks
    .map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

module.exports = { chunkText, cosineSimilarity, topKRelevantChunks };

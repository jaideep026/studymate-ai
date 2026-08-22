const express = require('express');
const Document = require('../models/Document');
const ChatMessage = require('../models/ChatMessage');
const { requireAuth } = require('../middleware/auth');
const { topKRelevantChunks } = require('../services/vectorStore');
const { embedText, answerFromContext } = require('../services/openaiService');

const router = express.Router();

router.use(requireAuth);

// Ask a question grounded in a specific uploaded document (RAG over notes).
router.post('/:documentId/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const doc = await Document.findOne({ _id: req.params.documentId, owner: req.user.id });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const queryEmbedding = await embedText(question);
    const topChunks = topKRelevantChunks(queryEmbedding, doc.chunks, 3);
    const contextTexts = topChunks.map((c) => c.text);

    const { answer, citedIndexes } = await answerFromContext(question, contextTexts);

    const chatMessage = await ChatMessage.create({
      document: doc._id,
      user: req.user.id,
      question,
      answer,
      sourceChunks: contextTexts,
      citedChunkIndexes: citedIndexes,
    });

    res.status(201).json({
      answer,
      sources: contextTexts,
      citedIndexes,
      messageId: chatMessage._id,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to answer question', details: err.message });
  }
});

router.get('/:documentId/history', async (req, res) => {
  const history = await ChatMessage.find({
    document: req.params.documentId,
    user: req.user.id,
  }).sort({ createdAt: 1 });
  res.json(history);
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const Document = require('../models/Document');
const { requireAuth } = require('../middleware/auth');
const { chunkText } = require('../services/vectorStore');
const { embedText } = require('../services/openaiService');
const { extractTextFromFile } = require('../services/fileParser');
const { buildFlashcards, buildStudyTips, buildExamQuestions } = require('../services/studyTools');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

router.use(requireAuth);

async function saveDocument({ owner, title, text, sourceType }) {
  const rawChunks = chunkText(text);
  const chunks = await Promise.all(
    rawChunks.map(async (chunkText_) => ({
      text: chunkText_,
      embedding: await embedText(chunkText_),
    }))
  );

  return Document.create({
    owner,
    title,
    rawText: text,
    sourceType,
    chunks,
    flashcards: [],
    studyTips: [],
    examQuestions: [],
    examAttempts: [],
  });
}

// Given a document's cached exam questions and its full attempt history,
// compute per-question mastery: how many times each question has been
// answered right vs. wrong, and which ones still need work. A question
// counts as "weak" if it has never been answered correctly, or has been
// answered wrong at least as often as right.
function computeMastery(doc) {
  const perQuestion = doc.examQuestions.map((q, index) => {
    const attempts = doc.examAttempts.filter((a) => a.questionIndex === index);
    const timesCorrect = attempts.filter((a) => a.correct).length;
    const timesWrong = attempts.length - timesCorrect;
    return {
      questionIndex: index,
      question: q.question,
      timesCorrect,
      timesWrong,
      attempts: attempts.length,
      weak: attempts.length === 0 ? false : timesWrong >= timesCorrect,
      untested: attempts.length === 0,
    };
  });

  const weakQuestionIndexes = perQuestion
    .filter((p) => p.weak || p.untested)
    .map((p) => p.questionIndex);

  return { perQuestion, weakQuestionIndexes };
}

// Upload a note by pasting text directly.
router.post('/', async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!title || !text) {
      return res.status(400).json({ error: 'title and text are required' });
    }

    const doc = await saveDocument({ owner: req.user.id, title, text, sourceType: 'text' });

    res.status(201).json({
      id: doc._id,
      title: doc.title,
      sourceType: doc.sourceType,
      chunkCount: doc.chunks.length,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save document', details: err.message });
  }
});

// Upload a note as a PDF, PPTX, or DOCX file.
router.post('/file', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Max size is 15MB.' : err.message;
      return res.status(400).json({ error: message });
    }
    if (err) return next(err);
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { text, sourceType } = await extractTextFromFile(req.file);
    const title = (req.body.title || req.file.originalname.replace(/\.[^.]+$/, '')).trim();

    const doc = await saveDocument({ owner: req.user.id, title, text, sourceType });

    res.status(201).json({
      id: doc._id,
      title: doc.title,
      sourceType: doc.sourceType,
      chunkCount: doc.chunks.length,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to process file' });
  }
});

router.get('/', async (req, res) => {
  const docs = await Document.find({ owner: req.user.id })
    .select('title sourceType createdAt')
    .sort({ createdAt: -1 });
  res.json(docs);
});

async function loadOwnedDoc(req, res) {
  const doc = await Document.findOne({ _id: req.params.id, owner: req.user.id });
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return null;
  }
  return doc;
}

// Flashcards: generated once, cached on the document, regenerated on demand.
router.post('/:id/flashcards', async (req, res) => {
  try {
    const doc = await loadOwnedDoc(req, res);
    if (!doc) return;

    if (!doc.flashcards.length || req.query.regenerate === 'true') {
      doc.flashcards = await buildFlashcards(doc.rawText);
      await doc.save();
    }
    res.json({ flashcards: doc.flashcards });
  } catch (err) {
    res.status(500).json({ error: 'Failed to build flashcards', details: err.message });
  }
});

// Memorization tips / mnemonics.
router.post('/:id/tips', async (req, res) => {
  try {
    const doc = await loadOwnedDoc(req, res);
    if (!doc) return;

    if (!doc.studyTips.length || req.query.regenerate === 'true') {
      doc.studyTips = await buildStudyTips(doc.rawText);
      await doc.save();
    }
    res.json({ tips: doc.studyTips });
  } catch (err) {
    res.status(500).json({ error: 'Failed to build study tips', details: err.message });
  }
});

// Exam mode: timed multiple-choice practice questions.
router.post('/:id/exam', async (req, res) => {
  try {
    const doc = await loadOwnedDoc(req, res);
    if (!doc) return;

    if (!doc.examQuestions.length || req.query.regenerate === 'true') {
      doc.examQuestions = await buildExamQuestions(doc.rawText);
      await doc.save();
    }
    res.json({ questions: doc.examQuestions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to build exam questions', details: err.message });
  }
});

// Record the result of answering one exam-mode question, so mastery can be
// tracked across sessions instead of forgotten the moment the tab closes.
router.post('/:id/exam/attempt', async (req, res) => {
  try {
    const doc = await loadOwnedDoc(req, res);
    if (!doc) return;

    const { questionIndex, correct } = req.body;
    if (!Number.isInteger(questionIndex) || typeof correct !== 'boolean') {
      return res.status(400).json({ error: 'questionIndex (number) and correct (boolean) are required' });
    }
    if (questionIndex < 0 || questionIndex >= doc.examQuestions.length) {
      return res.status(400).json({ error: 'questionIndex out of range for this document' });
    }

    doc.examAttempts.push({ questionIndex, correct, answeredAt: new Date() });
    await doc.save();

    res.status(201).json(computeMastery(doc));
  } catch (err) {
    res.status(500).json({ error: 'Failed to record exam attempt', details: err.message });
  }
});

// Weak-spot summary: which questions this student keeps missing, across all
// past exam-mode attempts on this document — the thing a plain chat window
// has no way to remember.
router.get('/:id/exam/mastery', async (req, res) => {
  try {
    const doc = await loadOwnedDoc(req, res);
    if (!doc) return;

    res.json(computeMastery(doc));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load mastery data', details: err.message });
  }
});

module.exports = router;

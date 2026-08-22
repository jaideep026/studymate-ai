// Builds flashcards, memorization tips, and exam-mode practice questions
// from a document's raw text using the Gemini-backed generateJSON helper.
// Every function has a deterministic, no-API-key-needed fallback so these
// features still return something reasonable in offline mode, matching the
// rest of the app's "never hard-fail" pattern.
const { generateJSON } = require('./openaiService');

function truncate(text, max = 12000) {
  return text.length > max ? text.slice(0, max) : text;
}

async function buildFlashcards(rawText, count = 10) {
  const prompt = `From the study notes below, generate ${count} flashcards as a JSON array of objects with "front" (a short question or term) and "back" (the concise answer). Cover the most important, testable facts. Return ONLY the JSON array.\n\nNotes:\n${truncate(rawText)}`;
  const result = await generateJSON(prompt);
  if (Array.isArray(result) && result.length) {
    return result
      .filter((c) => c && c.front && c.back)
      .slice(0, count)
      .map((c) => ({ front: String(c.front), back: String(c.back) }));
  }
  return fallbackFlashcards(rawText, count);
}

async function buildStudyTips(rawText, count = 6) {
  const prompt = `From the study notes below, write ${count} short, punchy memorization tips or mnemonics that would help a student remember the key ideas. Return ONLY a JSON array of strings, each one tip, no numbering.\n\nNotes:\n${truncate(rawText)}`;
  const result = await generateJSON(prompt);
  if (Array.isArray(result) && result.length) {
    return result.filter(Boolean).map(String).slice(0, count);
  }
  return fallbackTips(rawText, count);
}

async function buildExamQuestions(rawText, count = 8) {
  const prompt = `From the study notes below, generate ${count} multiple-choice practice questions as a JSON array of objects with "question" (string), "options" (array of exactly 4 strings), "correctIndex" (0-based index into options), and "explanation" (one sentence, why that answer is correct). Base every question strictly on the notes. Return ONLY the JSON array.\n\nNotes:\n${truncate(rawText)}`;
  const result = await generateJSON(prompt);
  if (Array.isArray(result) && result.length) {
    return result
      .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length === 4)
      .slice(0, count)
      .map((q) => ({
        question: String(q.question),
        options: q.options.map(String),
        correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
        explanation: String(q.explanation || ''),
      }));
  }
  return fallbackExam(rawText, count);
}

// --- Offline fallbacks: no API key, or the live call failed. Deterministic,
// not fancy, but keeps every feature usable end to end without a key. ---

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function fallbackFlashcards(rawText, count) {
  const sentences = splitSentences(rawText).slice(0, count);
  return sentences.map((s, i) => ({
    front: `Key point ${i + 1} — fill in the blank`,
    back: s,
  }));
}

function fallbackTips(rawText, count) {
  const sentences = splitSentences(rawText).slice(0, count);
  return sentences.map((s) => `Remember: ${s.split(' ').slice(0, 12).join(' ')}...`);
}

function fallbackExam(rawText, count) {
  const sentences = splitSentences(rawText).slice(0, count);
  return sentences.map((s) => ({
    question: `Which statement best matches your notes: "${s.slice(0, 60)}..."?`,
    options: [s, 'This is not mentioned in the notes', 'The opposite is true', 'Not enough information'],
    correctIndex: 0,
    explanation: 'Taken directly from the uploaded notes (offline mode — connect a Gemini key for generated distractors).',
  }));
}

module.exports = { buildFlashcards, buildStudyTips, buildExamQuestions };

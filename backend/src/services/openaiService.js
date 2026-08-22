// Uses Google's Gemini API through its OpenAI-compatible endpoint, so the
// rest of the app (and this file's shape) stays identical to a native
// OpenAI integration. See: https://ai.google.dev/gemini-api/docs/openai
//
// Both functions below degrade gracefully: if no key is configured, or if
// a live call to Gemini fails for any reason (bad key, quota, network),
// they fall back to a deterministic local behavior instead of throwing, so
// a single upstream hiccup never turns into a hard 500 for the student.
const OpenAI = require('openai');

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const CHAT_MODEL = 'gemini-3.7-flash';
const EMBEDDING_MODEL = 'gemini-embedding-001';

let client = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: GEMINI_BASE_URL,
    });
  }
  return client;
}

async function embedText(text) {
  const gemini = getClient();
  if (!gemini) {
    return fallbackEmbedding(text);
  }
  try {
    const response = await gemini.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error('[gemini] embedText failed, using local fallback embedding:', err.message);
    return fallbackEmbedding(text);
  }
}

// Returns { answer, citedIndexes }. citedIndexes are 0-based positions into
// contextChunks, marking which retrieved passages the model actually says it
// used — this is what lets the UI show "this answer came from passage 2",
// instead of just trusting the model blindly.
async function answerFromContext(question, contextChunks) {
  const gemini = getClient();

  if (!gemini) {
    return { answer: offlineAnswer(contextChunks), citedIndexes: contextChunks.length ? [0] : [] };
  }

  const numberedContext = contextChunks
    .map((c, i) => `[Passage ${i}]\n${c}`)
    .join('\n\n');

  try {
    const completion = await gemini.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are StudyMate, a study assistant. Answer strictly using the provided numbered passages, never your own outside knowledge. If the answer is not in the passages, say you are not sure. ' +
            'Respond with ONLY a JSON object of the shape {"answer": string, "citedPassages": number[]} — citedPassages lists the passage numbers you actually drew the answer from. No markdown fences, no commentary.',
        },
        { role: 'user', content: `${numberedContext}\n\nQuestion: ${question}` },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content.trim();
    const cleaned = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    const citedIndexes = Array.isArray(parsed.citedPassages)
      ? parsed.citedPassages.filter((i) => Number.isInteger(i) && i >= 0 && i < contextChunks.length)
      : [];

    return {
      answer: String(parsed.answer || '').trim() || offlineAnswer(contextChunks),
      citedIndexes: citedIndexes.length ? citedIndexes : contextChunks.length ? [0] : [],
    };
  } catch (err) {
    console.error('[gemini] answerFromContext failed, using offline fallback:', err.message);
    return { answer: offlineAnswer(contextChunks), citedIndexes: contextChunks.length ? [0] : [] };
  }
}

async function generateJSON(prompt) {
  const gemini = getClient();
  if (!gemini) return null;
  try {
    const completion = await gemini.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You output only valid JSON. No markdown fences, no commentary, just the JSON value requested.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });
    const raw = completion.choices[0].message.content.trim();
    const cleaned = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[gemini] generateJSON failed:', err.message);
    return null;
  }
}

function offlineAnswer(contextChunks) {
  return `[offline mode] Based on your notes: ${contextChunks[0]?.slice(0, 200) || 'no matching context found.'}`;
}

// Simple bag-of-characters hash embedding used only when no API key is present
// or the live embedding call failed.
function fallbackEmbedding(text, dims = 32) {
  const vec = new Array(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[text.charCodeAt(i) % dims] += 1;
  }
  return vec;
}

// Diagnostic only: makes one real, minimal call to Gemini and reports
// whether it actually succeeded, without ever throwing. Used by
// /api/health/gemini so connectivity/auth problems are visible from the
// outside instead of silently vanishing into the offline-mode fallback.
async function checkGeminiConnection() {
  if (!process.env.GEMINI_API_KEY) {
    return { configured: false, ok: false, error: 'GEMINI_API_KEY is not set on this service' };
  }
  const gemini = getClient();
  try {
    const completion = await gemini.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: 'Reply with exactly: pong' }],
    });
    return {
      configured: true,
      ok: true,
      model: CHAT_MODEL,
      reply: completion.choices[0].message.content,
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      model: CHAT_MODEL,
      error: err.message,
      status: err.status || null,
    };
  }
}

module.exports = { embedText, answerFromContext, generateJSON, checkGeminiConnection };

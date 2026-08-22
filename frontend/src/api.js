// In production this is served from the same Express server as the API
// (see backend/src/app.js), so a plain relative "/api" works with zero
// configuration. VITE_API_BASE_URL is still honored if you ever split the
// frontend out to its own host (e.g. Vercel) again.
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

async function request(path, { method = "GET", token, adminKey, body, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (adminKey) headers["x-admin-key"] = adminKey;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  register: (name, email, password) =>
    request("/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  listDocuments: (token) => request("/documents", { token }),
  uploadDocument: (token, title, text) =>
    request("/documents", { method: "POST", token, body: { title, text } }),
  uploadFile: (token, file, title) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    return request("/documents/file", { method: "POST", token, body: form, isForm: true });
  },
  ask: (token, documentId, question) =>
    request(`/chat/${documentId}/ask`, { method: "POST", token, body: { question } }),
  history: (token, documentId) => request(`/chat/${documentId}/history`, { token }),
  flashcards: (token, documentId, regenerate = false) =>
    request(`/documents/${documentId}/flashcards${regenerate ? "?regenerate=true" : ""}`, {
      method: "POST",
      token,
    }),
  studyTips: (token, documentId, regenerate = false) =>
    request(`/documents/${documentId}/tips${regenerate ? "?regenerate=true" : ""}`, {
      method: "POST",
      token,
    }),
  examQuestions: (token, documentId, regenerate = false) =>
    request(`/documents/${documentId}/exam${regenerate ? "?regenerate=true" : ""}`, {
      method: "POST",
      token,
    }),
  examAttempt: (token, documentId, questionIndex, correct) =>
    request(`/documents/${documentId}/exam/attempt`, {
      method: "POST",
      token,
      body: { questionIndex, correct },
    }),
  examMastery: (token, documentId) =>
    request(`/documents/${documentId}/exam/mastery`, { token }),
  adminStats: (adminKey) => request("/stats", { adminKey }),
};

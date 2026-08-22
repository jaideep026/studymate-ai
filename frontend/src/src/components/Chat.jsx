import { useEffect, useState } from "react";
import { api } from "../api";

export default function Chat({ token, documents }) {
  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (documents.length && !documentId) {
      setDocumentId(documents[0].id || documents[0]._id);
    }
  }, [documents, documentId]);

  useEffect(() => {
    if (!documentId) return;
    api
      .history(token, documentId)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [documentId, token]);

  async function handleAsk(e) {
    e.preventDefault();
    if (!documentId || !question.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.ask(token, documentId, question);
      setMessages((prev) => [...prev, { question, answer: res.answer, sourceChunks: res.sources }]);
      setQuestion("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!documents.length) {
    return (
      <div className="card">
        <h2>Chat</h2>
        <p>Upload a note first, then come back here to ask questions about it.</p>
      </div>
    );
  }

  return (
    <div className="card chat-card">
      <h2>Chat with your notes</h2>
      <label>
        Document
        <select value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
          {documents.map((doc) => (
            <option key={doc.id || doc._id} value={doc.id || doc._id}>
              {doc.title}
            </option>
          ))}
        </select>
      </label>

      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className="message-pair">
            <div className="bubble question">{m.question}</div>
            <div className="bubble answer">{m.answer}</div>
          </div>
        ))}
        {!messages.length && <p className="muted">No questions asked yet.</p>}
      </div>

      <form onSubmit={handleAsk} className="ask-form">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something about your notes..."
        />
        <button type="submit" disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

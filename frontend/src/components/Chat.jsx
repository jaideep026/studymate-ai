import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

function SourceChips({ sources, cited }) {
  const [openIndex, setOpenIndex] = useState(null);
  if (!sources?.length) return null;

  return (
    <div className="source-chips">
      <div className="source-chips-row">
        {sources.map((_, i) => {
          const isCited = cited?.includes(i);
          return (
            <button
              key={i}
              className={`source-chip${isCited ? " source-chip-cited" : ""}${openIndex === i ? " source-chip-open" : ""}`}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              title={isCited ? "Used to answer this" : "Retrieved but not cited"}
            >
              [{i + 1}]
            </button>
          );
        })}
        <span className="muted source-chips-hint">
          {cited?.length ? "cited passages" : "retrieved passages"}
        </span>
      </div>
      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            className="source-excerpt"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {sources[openIndex]}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Chat({ token, documentId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setLoadingHistory(true);
    api
      .history(token, documentId)
      .then((h) =>
        setMessages(
          h.map((m) => ({
            question: m.question,
            answer: m.answer,
            sourceChunks: m.sourceChunks,
            citedChunkIndexes: m.citedChunkIndexes,
          }))
        )
      )
      .catch(() => setMessages([]))
      .finally(() => setLoadingHistory(false));
  }, [documentId, token]);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setError("");
    setLoading(true);
    const asked = question;
    setQuestion("");
    try {
      const res = await api.ask(token, documentId, asked);
      setMessages((prev) => [
        ...prev,
        {
          question: asked,
          answer: res.answer,
          sourceChunks: res.sources,
          citedChunkIndexes: res.citedIndexes,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card chat-card">
      <h2>Chat with your notes</h2>
      <p className="card-hint">Answers only use what's in this document, and show exactly which passage they came from.</p>

      <div className="messages">
        {loadingHistory && <p className="muted">Loading history...</p>}
        {!loadingHistory &&
          messages.map((m, i) => (
            <motion.div
              key={i}
              className="message-pair"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bubble question">{m.question}</div>
              <div className="bubble answer">
                {m.answer}
                <SourceChips sources={m.sourceChunks} cited={m.citedChunkIndexes} />
              </div>
            </motion.div>
          ))}
        {!loadingHistory && !messages.length && (
          <p className="muted">No questions asked yet — try one below.</p>
        )}
        {loading && (
          <motion.div className="bubble answer typing-bubble" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </motion.div>
        )}
      </div>

      <form onSubmit={handleAsk} className="ask-form">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something about your notes..."
        />
        <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.04 }} whileTap={{ scale: loading ? 1 : 0.95 }}>
          {loading ? "Thinking..." : "Ask"}
        </motion.button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

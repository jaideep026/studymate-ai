import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api";

export default function StudyTips({ token, documentId }) {
  const [tips, setTips] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function load(regenerate = false) {
    setLoading(true);
    setError("");
    try {
      const res = await api.studyTips(token, documentId, regenerate);
      setTips(res.tips);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="flashcard-toolbar">
        <h2>Memorization tips</h2>
        {!loading && (
          <button className="link-button" onClick={() => load(true)}>
            Regenerate
          </button>
        )}
      </div>
      <p className="card-hint">Short mnemonics generated from this document to help it stick.</p>

      {loading && <p className="muted">Thinking of tips...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="tips-list">
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              className="tip-item"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              whileHover={{ x: 4 }}
            >
              <span className="tip-num">{i + 1}</span>
              <p>{tip}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

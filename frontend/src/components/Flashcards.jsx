import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

export default function Flashcards({ token, documentId }) {
  const [cards, setCards] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function load(regenerate = false) {
    setLoading(true);
    setError("");
    try {
      const res = await api.flashcards(token, documentId, regenerate);
      setCards(res.flashcards);
      setIndex(0);
      setFlipped(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function go(delta) {
    if (!cards?.length) return;
    setDirection(delta);
    setFlipped(false);
    setIndex((i) => (i + delta + cards.length) % cards.length);
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Flashcards</h2>
        <p className="muted">Generating flashcards from your notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Flashcards</h2>
        <p className="error">{error}</p>
        <button onClick={() => load()}>Try again</button>
      </div>
    );
  }

  if (!cards?.length) {
    return (
      <div className="card">
        <h2>Flashcards</h2>
        <p className="muted">No flashcards yet.</p>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="card flashcard-panel">
      <div className="flashcard-toolbar">
        <h2>Flashcards</h2>
        <button className="link-button" onClick={() => load(true)}>
          Regenerate
        </button>
      </div>

      <div className="flashcard-stage">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 60 }}
            transition={{ duration: 0.25 }}
            className="flip-scene"
            onClick={() => setFlipped((f) => !f)}
          >
            <motion.div
              className="flip-card"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flip-face flip-front">
                <span className="flip-label">Question</span>
                <p>{card.front}</p>
                <span className="muted flip-hint">Click to flip</span>
              </div>
              <div className="flip-face flip-back">
                <span className="flip-label">Answer</span>
                <p>{card.back}</p>
                <span className="muted flip-hint">Click to flip back</span>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flashcard-controls">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => go(-1)}>
          &larr; Prev
        </motion.button>
        <div className="flashcard-dots">
          {cards.map((_, i) => (
            <span key={i} className={`dot${i === index ? " dot-active" : ""}`} />
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => go(1)}>
          Next &rarr;
        </motion.button>
      </div>
      <p className="muted flashcard-count">
        {index + 1} / {cards.length}
      </p>
    </div>
  );
}

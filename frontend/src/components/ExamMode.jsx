import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

export default function ExamMode({ token, documentId }) {
  const [questions, setQuestions] = useState(null);
  const [mastery, setMastery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("start"); // start | quiz | results
  const [order, setOrder] = useState([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [startedAt, setStartedAt] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function load(regenerate = false) {
    setLoading(true);
    setError("");
    try {
      const [examRes, masteryRes] = await Promise.all([
        api.examQuestions(token, documentId, regenerate),
        api.examMastery(token, documentId).catch(() => null),
      ]);
      setQuestions(examRes.questions);
      setMastery(masteryRes);
      setPhase("start");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startQuiz(focusWeak) {
    const weakSet = new Set(mastery?.weakQuestionIndexes || []);
    const indexes = questions.map((_, i) => i);
    const chosen = focusWeak && weakSet.size ? indexes.filter((i) => weakSet.has(i)) : indexes;
    setOrder(chosen.length ? chosen : indexes);
    setQi(0);
    setPicked(null);
    setResults([]);
    setStartedAt(Date.now());
    setPhase("quiz");
  }

  async function answer(optionIndex) {
    if (picked !== null) return;
    const questionIndex = order[qi];
    const q = questions[questionIndex];
    const correct = optionIndex === q.correctIndex;
    setPicked(optionIndex);
    setResults((prev) => [...prev, { questionIndex, correct }]);
    api.examAttempt(token, documentId, questionIndex, correct).catch(() => {});
  }

  function next() {
    if (qi + 1 < order.length) {
      setQi((i) => i + 1);
      setPicked(null);
    } else {
      finishQuiz();
    }
  }

  async function finishQuiz() {
    setPhase("results");
    try {
      const masteryRes = await api.examMastery(token, documentId);
      setMastery(masteryRes);
    } catch {
      // non-fatal
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Exam Mode</h2>
        <p className="muted">Preparing practice questions...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="card">
        <h2>Exam Mode</h2>
        <p className="error">{error}</p>
        <button onClick={() => load()}>Try again</button>
      </div>
    );
  }
  if (!questions?.length) {
    return (
      <div className="card">
        <h2>Exam Mode</h2>
        <p className="muted">No practice questions yet.</p>
      </div>
    );
  }

  if (phase === "start") {
    const weakCount = mastery?.weakQuestionIndexes?.length || 0;
    return (
      <div className="card exam-start">
        <div className="flashcard-toolbar">
          <h2>Exam Mode</h2>
          <button className="link-button" onClick={() => load(true)}>
            New question set
          </button>
        </div>
        <p className="card-hint">{questions.length} practice questions, generated from this document.</p>

        {weakCount > 0 && (
          <div className="weak-callout">
            <strong>{weakCount}</strong> question{weakCount === 1 ? "" : "s"} you've missed before —
            focus mode drills those first.
          </div>
        )}

        <div className="exam-start-actions">
          <motion.button className="cta" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => startQuiz(false)}>
            Start full exam
          </motion.button>
          {weakCount > 0 && (
            <motion.button
              className="cta cta-secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startQuiz(true)}
            >
              Focus on weak spots ({weakCount})
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    const questionIndex = order[qi];
    const q = questions[questionIndex];
    const progress = ((qi + (picked !== null ? 1 : 0)) / order.length) * 100;

    return (
      <div className="card exam-quiz">
        <div className="exam-progress-track">
          <motion.div
            className="exam-progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
        <p className="muted exam-count">
          Question {qi + 1} of {order.length}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={qi}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="exam-question">{q.question}</h3>
            <div className="exam-options">
              {q.options.map((opt, i) => {
                let cls = "exam-option";
                if (picked !== null) {
                  if (i === q.correctIndex) cls += " opt-correct";
                  else if (i === picked) cls += " opt-wrong";
                }
                return (
                  <motion.button
                    key={i}
                    className={cls}
                    onClick={() => answer(i)}
                    whileHover={picked === null ? { scale: 1.015 } : {}}
                    whileTap={picked === null ? { scale: 0.98 } : {}}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {picked !== null && (
              <motion.div
                className="exam-explanation"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p>{q.explanation}</p>
                <motion.button
                  className="cta"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={next}
                >
                  {qi + 1 < order.length ? "Next question" : "See results"}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // results
  const correctCount = results.filter((r) => r.correct).length;
  const pct = Math.round((correctCount / results.length) * 100);
  const elapsedSec = Math.round((Date.now() - startedAt) / 1000);

  return (
    <div className="card exam-results">
      <h2>Results</h2>
      <motion.div
        className="score-ring"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
      >
        <span className="score-num">{pct}%</span>
      </motion.div>
      <p className="muted">
        {correctCount} / {results.length} correct · {elapsedSec}s
      </p>

      <div className="exam-start-actions">
        <motion.button className="cta" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => startQuiz(false)}>
          Retake full exam
        </motion.button>
        <motion.button
          className="cta cta-secondary"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPhase("start")}
        >
          Back to overview
        </motion.button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

function DeviceFrame({ label, children }) {
  return (
    <div className="device-frame">
      <div className="device-frame-bar">
        <span className="device-dot" />
        <span className="device-dot" />
        <span className="device-dot" />
        <span className="device-frame-url">{label}</span>
      </div>
      <div className="device-frame-body">{children}</div>
    </div>
  );
}

function FlashcardDemo() {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setFlipped((f) => !f), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="demo-flip-scene" onClick={() => setFlipped((f) => !f)}>
      <motion.div
        className="demo-flip-card"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="demo-flip-face demo-flip-front">
          <span className="demo-flip-label">Front</span>
          <p>What force keeps a resting object at rest?</p>
        </div>
        <div className="demo-flip-face demo-flip-back">
          <span className="demo-flip-label">Back</span>
          <p>Inertia — Newton's First Law</p>
        </div>
      </motion.div>
    </div>
  );
}

function CitationDemo() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % 2), 2400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="demo-citation">
      <p className="demo-citation-answer">
        Deadlock happens when processes each hold a resource the other needs
        <sup className={active === 0 ? "cite-active" : ""}>[1]</sup> — it's prevented with
        resource ordering or the Banker's algorithm<sup className={active === 1 ? "cite-active" : ""}>[2]</sup>.
      </p>
      <div className="demo-citation-sources">
        <motion.div className={`demo-source${active === 0 ? " demo-source-active" : ""}`} layout>
          [1] "...each process holds a resource while waiting on another held by..."
        </motion.div>
        <motion.div className={`demo-source${active === 1 ? " demo-source-active" : ""}`} layout>
          [2] "...prevented via resource ordering, or avoided with Banker's algorithm."
        </motion.div>
      </div>
    </div>
  );
}

function ExamDemo() {
  const [picked, setPicked] = useState(null);
  const options = ["Inertia", "Momentum", "Friction", "Torque"];
  useEffect(() => {
    if (picked === null) return;
    const id = setTimeout(() => setPicked(null), 1600);
    return () => clearTimeout(id);
  }, [picked]);
  return (
    <div className="demo-exam">
      <p className="demo-exam-q">Which law explains why a resting object stays at rest?</p>
      <div className="demo-exam-options">
        {options.map((opt, i) => (
          <button
            key={opt}
            className={`demo-exam-opt${picked === i ? (i === 0 ? " opt-correct" : " opt-wrong") : ""}`}
            onClick={() => setPicked(i)}
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="demo-exam-note">Wrong answers get queued back into your weak-spot list — nothing resets when you close the tab.</p>
    </div>
  );
}

function useScrollHeader() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setSolid(v > 40));
  return solid;
}

export default function Landing({ onGetStarted }) {
  const solidNav = useScrollHeader();

  const features = [
    {
      eyebrow: "Flashcards",
      title: "Generated straight from what you uploaded",
      body: "No manual writing, no copying into a separate app. One click turns the document into a flip-card deck.",
      demo: <FlashcardDemo />,
      frame: "studymate.ai / flashcards",
    },
    {
      eyebrow: "Exam mode",
      title: "Remembers what you keep getting wrong",
      body: "Every attempt is scored and stored against the question, so the same weak spot doesn't quietly reappear next week.",
      demo: <ExamDemo />,
      frame: "studymate.ai / exam-mode",
    },
  ];

  return (
    <div className="landing">
      <motion.nav
        className={`landing-nav${solidNav ? " landing-nav-solid" : ""}`}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="brand">StudyMate AI</span>
        <motion.button
          className="nav-link"
          onClick={onGetStarted}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Log in
        </motion.button>
      </motion.nav>

      <section className="intro">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="intro-kicker">Retrieval-grounded, not guessed</span>
          <h1>
            Every answer points back to the exact line in your notes it came from.
          </h1>
          <p className="intro-sub">
            Upload a PDF, slide deck, or Word doc. Ask a question and get an answer built only
            from what's actually in the file — with the source passage shown next to it, not
            hidden behind a "trust me."
          </p>
          <motion.button
            className="cta"
            onClick={onGetStarted}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Log in and upload something
          </motion.button>
          <p className="intro-meta">Free — runs on Gemini's free tier, no card needed.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <DeviceFrame label="studymate.ai / chat · os-fundamentals.pdf">
            <CitationDemo />
          </DeviceFrame>
        </motion.div>
      </section>

      {features.map((f, i) => (
        <FeatureRow key={f.title} feature={f} reversed={i % 2 === 1} />
      ))}

      <section className="closing">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
        >
          Your weak spots don't reset every time you close the tab. <br /> Neither should your notes.
        </motion.h2>
        <motion.button
          className="cta"
          onClick={onGetStarted}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          Get started — it's free
        </motion.button>
      </section>

      <footer className="landing-footer">
        <p>Built by Jaideep Kommineni — full-stack app with a retrieval-augmented generation pipeline</p>
      </footer>
    </div>
  );
}

function FeatureRow({ feature, reversed }) {
  return (
    <section className={`feature-row${reversed ? " feature-row-rev" : ""}`}>
      <motion.div
        className="feature-copy"
        initial={{ opacity: 0, x: reversed ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="eyebrow-light">{feature.eyebrow}</span>
        <h3>{feature.title}</h3>
        <p>{feature.body}</p>
      </motion.div>
      <motion.div
        className="feature-demo-wrap"
        initial={{ opacity: 0, x: reversed ? -40 : 40, scale: 0.96 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <DeviceFrame label={feature.frame}>{feature.demo}</DeviceFrame>
      </motion.div>
    </section>
  );
}

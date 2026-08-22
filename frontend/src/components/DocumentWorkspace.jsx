import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Chat from "./Chat";
import Flashcards from "./Flashcards";
import StudyTips from "./StudyTips";
import ExamMode from "./ExamMode";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "flashcards", label: "Flashcards" },
  { id: "tips", label: "Study Tips" },
  { id: "exam", label: "Exam Mode" },
];

export default function DocumentWorkspace({ token, document }) {
  const [tab, setTab] = useState("chat");
  const documentId = document.id || document._id;

  return (
    <div className="workspace">
      <div className="workspace-header">
        <h2>{document.title}</h2>
        <div className="tab-row">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn${tab === t.id ? " tab-btn-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {tab === t.id && <motion.div className="tab-underline" layoutId="tab-underline" />}
            </button>
          ))}
        </div>
      </div>

      <div className="workspace-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {tab === "chat" && <Chat token={token} documentId={documentId} />}
            {tab === "flashcards" && <Flashcards token={token} documentId={documentId} />}
            {tab === "tips" && <StudyTips token={token} documentId={documentId} />}
            {tab === "exam" && <ExamMode token={token} documentId={documentId} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import Upload from "./Upload";
import DocumentWorkspace from "./DocumentWorkspace";

const SOURCE_LABEL = { text: "Text", pdf: "PDF", pptx: "Slides", docx: "Word" };

export default function Dashboard({ token, user, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function refreshDocuments(selectNewest = false) {
    try {
      setLoadingDocs(true);
      const docs = await api.listDocuments(token);
      setDocuments(docs);
      if (selectNewest && docs.length) {
        setActiveId(docs[0].id || docs[0]._id);
      }
    } catch (err) {
      // non-fatal: sidebar just stays empty
    } finally {
      setLoadingDocs(false);
    }
  }

  function handleUploaded() {
    setShowUpload(false);
    refreshDocuments(true);
  }

  const activeDoc = documents.find((d) => (d.id || d._id) === activeId);

  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="brand-dot" />
          StudyMate AI
        </div>

        <motion.button
          className="dash-new-btn"
          onClick={() => setShowUpload(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          + Upload notes
        </motion.button>

        <div className="dash-doc-list">
          {loadingDocs && <p className="muted dash-empty">Loading...</p>}
          {!loadingDocs && !documents.length && (
            <p className="muted dash-empty">No notes yet — upload your first one.</p>
          )}
          <AnimatePresence>
            {documents.map((doc, i) => {
              const id = doc.id || doc._id;
              return (
                <motion.button
                  key={id}
                  className={`dash-doc-item${id === activeId ? " dash-doc-active" : ""}`}
                  onClick={() => setActiveId(id)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  whileHover={{ x: 3 }}
                >
                  <span className="dash-doc-title">{doc.title}</span>
                  <span className="dash-doc-tag">{SOURCE_LABEL[doc.sourceType] || "Text"}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="dash-user">
          <span>{user?.name}</span>
          <button className="link-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <AnimatePresence mode="wait">
          {activeDoc ? (
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{ height: "100%" }}
            >
              <DocumentWorkspace token={token} document={activeDoc} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="dash-empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2>Pick a document, or upload a new one</h2>
              <p className="muted">
                Chat, flashcards, memorization tips, and exam mode all live here once you have
                notes uploaded.
              </p>
              <motion.button
                className="cta"
                onClick={() => setShowUpload(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                Upload your first note
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showUpload && (
          <Upload token={token} onUploaded={handleUploaded} onClose={() => setShowUpload(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

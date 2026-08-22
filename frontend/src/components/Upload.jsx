import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api";

const ACCEPTED_EXT = [".pdf", ".pptx", ".docx"];

export default function Upload({ token, onUploaded, onClose }) {
  const [mode, setMode] = useState("file"); // "file" | "text"
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("");
  const [statusOk, setStatusOk] = useState(true);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  function pickFile(f) {
    if (!f) return;
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      setStatusOk(false);
      setStatus("Please choose a PDF, PPTX, or DOCX file.");
      return;
    }
    setStatus("");
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      if (mode === "file") {
        if (!file) throw new Error("Choose a file first");
        const doc = await api.uploadFile(token, file, title);
        setStatusOk(true);
        setStatus(`Saved "${doc.title}" as ${doc.chunkCount} chunks.`);
        onUploaded(doc);
      } else {
        if (!title || !text) throw new Error("Title and notes are required");
        const doc = await api.uploadDocument(token, title, text);
        setStatusOk(true);
        setStatus(`Saved "${doc.title}" as ${doc.chunkCount} chunks.`);
        onUploaded(doc);
      }
    } catch (err) {
      setStatusOk(false);
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-card"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Upload notes</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="upload-tabs">
          <button
            className={`upload-tab${mode === "file" ? " upload-tab-active" : ""}`}
            onClick={() => setMode("file")}
            type="button"
          >
            Upload a file
          </button>
          <button
            className={`upload-tab${mode === "text" ? " upload-tab-active" : ""}`}
            onClick={() => setMode("text")}
            type="button"
          >
            Paste text
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "file" ? (
            <>
              <div
                className={`dropzone${dragActive ? " dropzone-active" : ""}${file ? " dropzone-filled" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  pickFile(e.dataTransfer.files[0]);
                }}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.pptx,.docx"
                  hidden
                  onChange={(e) => pickFile(e.target.files[0])}
                />
                {file ? (
                  <>
                    <span className="dropzone-file-name">{file.name}</span>
                    <span className="muted">Click to choose a different file</span>
                  </>
                ) : (
                  <>
                    <span className="dropzone-title">Drag a file here, or click to browse</span>
                    <span className="muted">PDF, PPTX, or DOCX — up to 15MB</span>
                  </>
                )}
              </div>
              <label>
                Title <span className="muted">(optional — defaults to the filename)</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
            </>
          ) : (
            <>
              <label>
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 — Thermodynamics"
                  required={mode === "text"}
                />
              </label>
              <label>
                Notes
                <textarea
                  rows={7}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your notes here..."
                  required={mode === "text"}
                />
              </label>
            </>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
          >
            {loading ? "Uploading..." : "Upload"}
          </motion.button>
        </form>
        {status && <p className={statusOk ? "status" : "error"}>{status}</p>}
      </motion.div>
    </motion.div>
  );
}

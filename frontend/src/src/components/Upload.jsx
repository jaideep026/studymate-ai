import { useState } from "react";
import { api } from "../api";

export default function Upload({ token, onUploaded }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const doc = await api.uploadDocument(token, title, text);
      setStatus(`Saved "${doc.title}" as ${doc.chunkCount} chunks.`);
      setTitle("");
      setText("");
      onUploaded(doc);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Upload notes</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Notes
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your notes here..."
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {status && <p className="status">{status}</p>}
    </div>
  );
}

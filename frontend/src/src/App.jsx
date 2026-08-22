import { useState } from "react";
import Landing from "./components/Landing";
import Auth from "./components/Auth";
import Upload from "./components/Upload";
import Chat from "./components/Chat";
import AdminStats from "./components/AdminStats";
import "./styles.css";

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [view, setView] = useState("landing"); // "landing" | "auth" | "app"

  const isAdminRoute =
    typeof window !== "undefined" && window.location.pathname.replace(/\/$/, "") === "/admin";

  function handleAuthed(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
    setView("app");
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setDocuments([]);
    setView("landing");
  }

  function handleUploaded(doc) {
    setDocuments((prev) => [...prev, doc]);
  }

  if (isAdminRoute) {
    return <AdminStats />;
  }

  if (!token && view === "landing") {
    return <Landing onGetStarted={() => setView("auth")} />;
  }

  return (
    <div className="app">
      <header>
        <h1>StudyMate AI</h1>
        <p className="tagline">Upload your notes. Ask questions. Get grounded answers.</p>
        {user && (
          <div className="user-bar">
            <span>Signed in as {user.name}</span>
            <button className="link-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </header>

      <main>
        {!token ? (
          <>
            <Auth onAuthed={handleAuthed} />
            <p className="back-home">
              <button className="link-button" onClick={() => setView("landing")}>
                Back to home
              </button>
            </p>
          </>
        ) : (
          <div className="grid">
            <Upload token={token} onUploaded={handleUploaded} />
            <Chat token={token} documents={documents} />
          </div>
        )}
      </main>
    </div>
  );
}

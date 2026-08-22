import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "./components/Landing";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import AdminStats from "./components/AdminStats";
import CustomCursor from "./components/CustomCursor";
import "./styles.css";

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
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
    setView("landing");
  }

  if (isAdminRoute) {
    return <AdminStats />;
  }

  return (
    <>
      <CustomCursor />
      <AnimatePresence mode="wait">
        {!token && view === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Landing onGetStarted={() => setView("auth")} />
          </motion.div>
        )}

        {!token && view === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <Auth onAuthed={handleAuthed} onBack={() => setView("landing")} />
          </motion.div>
        )}

        {token && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Dashboard token={token} user={user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

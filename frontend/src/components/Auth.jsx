import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

export default function Auth({ onAuthed, onBack }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(name, email, password);
      onAuthed(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <motion.button
        className="link-button back-link"
        onClick={onBack}
        whileHover={{ x: -3 }}
      >
        &larr; Back to home
      </motion.button>

      <motion.div
        className="card auth-card"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
          >
            <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="card-hint">
              {mode === "login"
                ? "Log in to pick up where you left off."
                : "Takes about 20 seconds. No credit card needed."}
            </p>
            <form onSubmit={handleSubmit}>
              {mode === "register" && (
                <label>
                  Name
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
              )}
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </label>
              {error && <p className="error">{error}</p>}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
              >
                {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
              </motion.button>
            </form>
          </motion.div>
        </AnimatePresence>
        <button
          className="link-button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </motion.div>
    </div>
  );
}

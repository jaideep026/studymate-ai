import { useState } from "react";
import { api } from "../api";

export default function AdminStats() {
  const [adminKey, setAdminKey] = useState("");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLoad(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.adminStats(adminKey);
      setStats(data);
    } catch (err) {
      setStats(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const maxVisits = stats
    ? Math.max(1, ...stats.visitsLast7Days.map((d) => d.count))
    : 1;

  return (
    <div className="app">
      <header>
        <h1>StudyMate AI — Admin</h1>
        <p className="tagline">Traffic and usage overview.</p>
      </header>

      <main>
        <div className="card auth-card">
          <h2>Enter admin key</h2>
          <form onSubmit={handleLoad}>
            <label>
              Admin key
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Load stats"}
            </button>
          </form>
        </div>

        {stats && (
          <>
            <div className="stats-grid">
              <div className="card stat-card">
                <span className="stat-number">{stats.totals.users}</span>
                <span className="muted">Users</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">{stats.totals.documents}</span>
                <span className="muted">Documents uploaded</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">{stats.totals.questions}</span>
                <span className="muted">Questions asked</span>
              </div>
              <div className="card stat-card">
                <span className="stat-number">{stats.totals.visits}</span>
                <span className="muted">Total requests</span>
              </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <h2>Visits — last 7 days</h2>
              <div className="bar-chart">
                {stats.visitsLast7Days.map((d) => (
                  <div className="bar-col" key={d.date}>
                    <div
                      className="bar"
                      style={{ height: `${(d.count / maxVisits) * 100}%` }}
                      title={`${d.count} visits`}
                    />
                    <span className="bar-label">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
              <p className="muted" style={{ marginTop: 10 }}>
                New users in the last 7 days: {stats.newUsersLast7Days}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

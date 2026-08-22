const express = require("express");
const User = require("../models/User");
const Document = require("../models/Document");
const ChatMessage = require("../models/ChatMessage");
const Visit = require("../models/Visit");

const router = express.Router();

// Simple shared-secret gate so raw usage numbers aren't public.
// Falls back to JWT_SECRET so no extra env var is required to deploy,
// but a dedicated ADMIN_KEY can be set separately if you want a distinct one.
function requireAdmin(req, res, next) {
  const provided = req.headers["x-admin-key"];
  const expected = process.env.ADMIN_KEY || process.env.JWT_SECRET;
  if (!expected || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function last7DaysBuckets(docs) {
  const buckets = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  docs.forEach((doc) => {
    const key = new Date(doc.createdAt).toISOString().slice(0, 10);
    if (key in buckets) buckets[key] += 1;
  });
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

// GET /api/stats - aggregate traffic/usage numbers for a simple admin view.
router.get("/", requireAdmin, async (req, res) => {
  try {
    const [users, documents, messages, visits] = await Promise.all([
      User.find({}),
      Document.find({}),
      ChatMessage.find({}),
      Visit.find({}),
    ]);

    res.json({
      totals: {
        users: users.length,
        documents: documents.length,
        questions: messages.length,
        visits: visits.length,
      },
      visitsLast7Days: last7DaysBuckets(visits),
      newUsersLast7Days: last7DaysBuckets(users),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load stats", details: err.message });
  }
});

module.exports = router;

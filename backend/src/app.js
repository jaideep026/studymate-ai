const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const chatRoutes = require('./routes/chat');
const statsRoutes = require('./routes/stats');
const Visit = require('./models/Visit');
const { checkGeminiConnection } = require('./services/openaiService');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Lightweight, non-blocking traffic tracking for the /api/stats dashboard.
  // Fire-and-forget: never awaited, never allowed to fail a real request.
  app.use((req, res, next) => {
    if (req.path !== '/api/health') {
      Visit.create({ path: req.path, method: req.method }).catch(() => {});
    }
    next();
  });

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Diagnostic: proves whether Gemini calls actually succeed in this
  // deployment, instead of guessing from symptoms like offline-mode text.
  app.get('/api/health/gemini', async (req, res) => {
    const result = await checkGeminiConnection();
    res.status(result.ok ? 200 : 502).json(result);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/stats', statsRoutes);

  // Single-service deployment: serve the built React app (frontend/dist)
  // straight from this Express server, so only one host is needed in
  // production (no separate Vercel deployment). Local dev is unaffected
  // since the frontend usually isn't built yet, in which case this block
  // just does nothing and the API behaves as before.
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };

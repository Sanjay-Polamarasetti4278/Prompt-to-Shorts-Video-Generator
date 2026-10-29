import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api.js';
import { cleanupExpiredVideos } from './services/storage.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
}));
app.use(express.json());

// Root endpoint: displays status dashboard for visitors
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>PromptToShorts API Backend</title>
        <style>
          body { background: #09090b; color: #f4f4f5; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #18181b; border: 1px solid #27272a; padding: 2rem; border-radius: 1rem; max-width: 480px; text-align: center; }
          h1 { color: #ec4899; margin-top: 0; }
          .badge { background: #052e16; color: #4ade80; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: bold; }
          a { color: #38bdf8; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🚀 PromptToShorts API</h1>
          <p><span class="badge">● Online & Ready</span></p>
          <p>Backend API server is running smoothly.</p>
          <p>Visit the web app here:<br><a href="https://prompt-to-shorts-video-generator.vercel.app" target="_blank">prompt-to-shorts-video-generator.vercel.app</a></p>
          <p style="color: #71717a; font-size: 0.75rem;">Endpoints: /api/quota, /api/generate, /api/jobs/:id</p>
        </div>
      </body>
    </html>
  `);
});

// Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'prompt-to-shorts-backend', uptime: process.uptime() });
});

// Only run periodic storage cleanup outside serverless
if (!process.env.VERCEL) {
  setInterval(() => {
    const result = cleanupExpiredVideos();
    if (result.deletedCount > 0) {
      console.log(`[Storage Cleanup] Deleted ${result.deletedCount} expired video files.`);
    }
  }, 60 * 60 * 1000);
}

// Only call listen if not running in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Prompt-to-Shorts Backend running on http://localhost:${PORT}`);
    console.log(`📡 Endpoints: /api/generate, /api/jobs/:id, /api/jobs/:id/events, /api/quota`);
  });
}

export default app;

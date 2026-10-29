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

// Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'prompt-to-shorts-backend', uptime: process.uptime() });
});

// Periodic 24-Hour Storage Cleanup (runs once per hour)
setInterval(() => {
  const result = cleanupExpiredVideos();
  if (result.deletedCount > 0) {
    console.log(`[Storage Cleanup] Deleted ${result.deletedCount} expired video files.`);
  }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Prompt-to-Shorts Backend running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints: /api/generate, /api/jobs/:id, /api/jobs/:id/events, /api/quota`);
});

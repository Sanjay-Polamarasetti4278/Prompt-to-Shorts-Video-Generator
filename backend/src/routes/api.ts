import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { jobQueue } from '../services/jobQueue.js';
import { rateLimiter } from '../services/rateLimiter.js';
import { validatePromptSafety } from '../services/classifier.js';
import { STORAGE_DIR } from '../services/storage.js';

export const apiRouter = Router();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

// Check remaining quota for the client IP
apiRouter.get('/quota', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const quota = rateLimiter.check(ip);
  res.json({
    remaining: quota.remaining,
    resetAt: quota.resetAt,
    maxPerDay: 3
  });
});

// Submit a new video generation job
apiRouter.post('/generate', (req: Request, res: Response) => {
  const { prompt, injectFailure } = req.body;
  const clientIp = getClientIp(req);

  // 1. Validate prompt format
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid prompt string.' });
  }

  const trimmed = prompt.trim();
  if (trimmed.length < 10) {
    return res.status(400).json({ error: 'Prompt must be at least 10 characters.' });
  }

  if (trimmed.length > 1000) {
    return res.status(400).json({ error: 'Prompt must not exceed 1,000 characters.' });
  }

  // 2. Check Content Safety (FR-4)
  const safety = validatePromptSafety(trimmed);
  if (!safety.isSafe) {
    return res.status(400).json({
      error: safety.reason,
      code: 'POLICY_VIOLATION'
    });
  }

  // 3. Check Device / IP Rate Limit (Section 8)
  const limitCheck = rateLimiter.check(clientIp);
  if (!limitCheck.allowed) {
    return res.status(429).json({
      error: 'Daily generation limit reached (3 videos per day). Please check back tomorrow!',
      resetAt: limitCheck.resetAt
    });
  }

  // Deduct quota
  rateLimiter.increment(clientIp);

  // 4. Enqueue Job
  const job = jobQueue.createJob(clientIp, trimmed, Boolean(injectFailure));

  res.status(202).json({
    success: true,
    job,
    remainingQuota: rateLimiter.getRemaining(clientIp)
  });
});

// Poll job status
apiRouter.get('/jobs/:id', (req: Request, res: Response) => {
  const job = jobQueue.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({ job });
});

// Real-Time Server-Sent Events (SSE) Stream
apiRouter.get('/jobs/:id/events', (req: Request, res: Response) => {
  const { id } = req.params;
  const job = jobQueue.getJob(id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state immediately
  res.write(`data: ${JSON.stringify(job)}\n\n`);

  // Listener for future job stage updates
  const onJobUpdate = (updatedJob: any) => {
    res.write(`data: ${JSON.stringify(updatedJob)}\n\n`);
    if (updatedJob.status === 'completed' || updatedJob.status === 'failed' || updatedJob.status === 'rejected') {
      res.end();
    }
  };

  jobQueue.on(`job:${id}`, onJobUpdate);

  req.on('close', () => {
    jobQueue.off(`job:${id}`, onJobUpdate);
  });
});

// Download / Stream 1080p Video Endpoint (FR-22, FR-23)
apiRouter.get('/download/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(STORAGE_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video file expired or not found.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // If HTML5 video requests partial content (range streaming)
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Direct file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', 'video/mp4');
    fs.createReadStream(filePath).pipe(res);
  }
});

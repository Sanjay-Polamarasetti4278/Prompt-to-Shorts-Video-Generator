import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_DIR = path.resolve(__dirname, '../../storage/videos');

// Ensure directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export function createSafeSlug(prompt: string): string {
  const clean = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 32)
    .replace(/^-+|-+$/g, '');
  return `${clean || 'video'}-60s-1080p.mp4`;
}

// 24-Hour Expiry Sweeper (PRD Section 8)
export function cleanupExpiredVideos(): { deletedCount: number } {
  const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();
  let deletedCount = 0;

  try {
    const files = fs.readdirSync(STORAGE_DIR);
    for (const file of files) {
      const filePath = path.join(STORAGE_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
  } catch (err) {
    console.error('Storage cleanup error:', err);
  }

  return { deletedCount };
}

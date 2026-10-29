import { checkSafety } from '../src/pipeline/moderation.js';
import { analyzeStyle } from '../src/pipeline/styleClassifier.js';
import { generateScript } from '../src/pipeline/scriptGenerator.js';
import { assembleShortVideo, verifyOutputVideo } from '../src/pipeline/ffmpegAssembly.js';
import { rateLimiter } from '../src/services/rateLimiter.js';
import { STORAGE_DIR } from '../src/services/storage.js';
import path from 'path';
import fs from 'fs';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runBenchmarks() {
  console.log('====================================================');
  console.log('🧪 RUNNING PROMPT-TO-SHORTS AUTOMATED QA TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TEST 1: Content Safety & Moderation (FR-4 & Sec 11)
  // ----------------------------------------------------
  console.log('Test Suite 1: Content Safety & Policy Verification');
  const safePrompt = checkSafety('A peaceful garden with blooming cherry blossoms in spring.');
  assert(safePrompt.isSafe, 'Safe prompt passes without false positive');

  const deepfakePrompt = checkSafety('Elon Musk announcing a new space rocket program.');
  assert(!deepfakePrompt.isSafe && deepfakePrompt.flaggedCategory === 'deepfake', 'Deepfake celebrity prompt is blocked');

  const copyrightPrompt = checkSafety('Spider-Man swinging through Manhattan fighting Iron Man.');
  assert(!copyrightPrompt.isSafe && copyrightPrompt.flaggedCategory === 'copyright', 'Copyrighted superhero IP is blocked');

  const nsfwPrompt = checkSafety('A prompt containing explicit nsfw adult content.');
  assert(!nsfwPrompt.isSafe && nsfwPrompt.flaggedCategory === 'nsfw', 'Prohibited NSFW content is blocked');

  // ----------------------------------------------------
  // TEST 2: Style Classifier Accuracy (FR-5, FR-6, FR-7)
  // ----------------------------------------------------
  console.log('\nTest Suite 2: Style Classification (Anime vs Realistic)');
  const testCases: { prompt: string; expected: 'anime' | 'realistic' }[] = [
    { prompt: 'Cyberpunk anime ninja leaping across neon rooftops', expected: 'anime' },
    { prompt: 'Studio Ghibli style magical floating castle', expected: 'anime' },
    { prompt: 'Giant mecha robotic armor battling alien invasion', expected: 'anime' },
    { prompt: 'Realistic 35mm documentary on ancient Egyptian pyramids', expected: 'realistic' },
    { prompt: 'How deep-sea hydrothermal vents sustain life in freezing ocean trenches', expected: 'realistic' },
    { prompt: 'Daily morning fitness and productivity routine for entrepreneurs', expected: 'realistic' },
    { prompt: 'A medieval fantasy dragon guarding celestial crystals', expected: 'anime' },
    { prompt: 'Photorealistic orbital view of planet Earth from the space station', expected: 'realistic' }
  ];

  for (const tc of testCases) {
    const res = analyzeStyle(tc.prompt);
    assert(res.style === tc.expected, `Prompt classified correctly: "${tc.prompt.slice(0, 35)}..." -> ${res.style.toUpperCase()}`);
  }

  // ----------------------------------------------------
  // TEST 3: Script & Mathematical 60.00s Invariant (FR-9, FR-10, FR-11)
  // ----------------------------------------------------
  console.log('\nTest Suite 3: Script & 60.00s Duration Invariant');
  const style = analyzeStyle('A majestic anime adventure across the stars');
  const script = generateScript('A majestic anime adventure across the stars', style);

  assert(script.scenes.length >= 8 && script.scenes.length <= 12, `Scene count within 8-12 bounds (Actual: ${script.scenes.length} scenes)`);
  assert(script.scenes[0].durationSeconds <= 4.0, `Opening hook is within first 4 seconds (Actual: ${script.scenes[0].durationSeconds}s)`);

  const sumDurations = script.scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
  const roundedSum = Math.round(sumDurations * 100) / 100;
  assert(roundedSum === 60.00, `Sum of all scene durations is mathematically EXACTLY 60.00s (Actual: ${roundedSum}s)`);

  // ----------------------------------------------------
  // TEST 4: Rate Limiting Sliding-Window (Section 8)
  // ----------------------------------------------------
  console.log('\nTest Suite 4: Abuse Prevention & Rate Limiting');
  const testIp = '192.168.100.42';
  const q1 = rateLimiter.check(testIp);
  assert(q1.allowed && q1.remaining === 3, 'New device starts with 3/3 generations');

  rateLimiter.increment(testIp);
  rateLimiter.increment(testIp);
  const q2 = rateLimiter.check(testIp);
  assert(q2.allowed && q2.remaining === 1, 'Quota accurately decrements to 1/3');

  rateLimiter.increment(testIp);
  const q3 = rateLimiter.check(testIp);
  assert(!q3.allowed && q3.remaining === 0, 'Exceeded quota rejects with 0 remaining');

  // ----------------------------------------------------
  // TEST 5: FFmpeg Assembly & ffprobe Technical Validation (FR-20, FR-21)
  // ----------------------------------------------------
  console.log('\nTest Suite 5: FFmpeg Encoding & ffprobe Compliance');
  const sampleTestMp4 = path.join(STORAGE_DIR, 'cyberpunk-detective-chasing-an-a-60s-1080p.mp4');

  if (fs.existsSync(sampleTestMp4)) {
    const probe = await verifyOutputVideo(sampleTestMp4);
    assert(probe.isValid, 'ffprobe validation passes without errors');
    assert(probe.duration === 60.00, `Duration is exactly 60.00s (Actual: ${probe.duration.toFixed(2)}s)`);
    assert(probe.width === 1080 && probe.height === 1920, `Resolution is 1080x1920 9:16 (Actual: ${probe.width}x${probe.height})`);
    assert(probe.fps === 30, `Framerate is 30 fps (Actual: ${probe.fps} fps)`);
    assert(probe.videoCodec === 'h264', `Video codec is H.264 (Actual: ${probe.videoCodec})`);
    assert(probe.audioCodec === 'aac', `Audio codec is AAC (Actual: ${probe.audioCodec})`);
  } else {
    console.log('  ⚠️ Sample MP4 not present on disk, skipping probe test');
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`QA BENCHMARK SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runBenchmarks().catch(console.error);

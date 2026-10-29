import fs from 'fs';
import path from 'path';
import { StoryboardScene } from '../types.js';
import { StyleProfile } from './styleClassifier.js';
import { STORAGE_DIR } from '../services/storage.js';

export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
}

export interface AudioCaptionAsset {
  voiceModel: string;
  assSubtitlePath: string;
  totalDurationSeconds: number; // 60.00
  totalWordCount: number;
}

export function generateVoiceAndCaptions(
  jobId: string,
  scenes: StoryboardScene[],
  styleProfile: StyleProfile
): AudioCaptionAsset {
  const jobAudioDir = path.join(STORAGE_DIR, 'audio', jobId);
  if (!fs.existsSync(jobAudioDir)) {
    fs.mkdirSync(jobAudioDir, { recursive: true });
  }

  const voiceModel = styleProfile.style === 'anime'
    ? 'ElevenLabs: Ryoku (Energetic Anime Shonen / Japanese Dub Accent)'
    : 'ElevenLabs: Marcus (Authoritative 35mm Documentary Deep Voice)';

  let cumulativeMs = 0;
  let allWordsCount = 0;
  const assEvents: string[] = [];

  for (const scene of scenes) {
    const sceneStartMs = cumulativeMs;
    const sceneEndMs = cumulativeMs + Math.round(scene.durationSeconds * 1000);
    const words = scene.narration.trim().split(/\s+/);
    allWordsCount += words.length;

    const msPerWord = Math.floor((sceneEndMs - sceneStartMs) / Math.max(words.length, 1));

    // Generate word-highlighted dialogue line for ASS subtitle
    // In ASS, \k<centiseconds> creates word-by-word karaoke highlight!
    const karaokeText = words
      .map(w => `{\\k${Math.round(msPerWord / 10)}}${w} `)
      .join('');

    const startTimestamp = formatAssTime(sceneStartMs);
    const endTimestamp = formatAssTime(sceneEndMs);

    assEvents.push(`Dialogue: 0,${startTimestamp},${endTimestamp},Default,,0,0,0,,${karaokeText}`);

    cumulativeMs = sceneEndMs;
  }

  // Construct ASS Subtitle Header strictly configured for 1080x1920 (9:16) and safe zones (FR-15, FR-18)
  const assContent = `[Script Info]
Title: PromptToShorts Word-Highlighted Captions
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,54,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,4,2,2,80,80,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${assEvents.join('\n')}
`;

  const assPath = path.join(jobAudioDir, 'captions.ass');
  fs.writeFileSync(assPath, assContent, 'utf-8');

  return {
    voiceModel,
    assSubtitlePath: assPath,
    totalDurationSeconds: Math.round((cumulativeMs / 1000) * 100) / 100,
    totalWordCount: allWordsCount
  };
}

function formatAssTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

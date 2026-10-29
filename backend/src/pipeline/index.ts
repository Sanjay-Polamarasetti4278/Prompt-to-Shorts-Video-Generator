import { checkSafety, ModerationResult } from './moderation.js';
import { analyzeStyle, StyleProfile } from './styleClassifier.js';
import { generateScript, GeneratedScript } from './scriptGenerator.js';
import { generateSceneVisuals, VisualFrameAsset } from './visualsGenerator.js';
import { generateVoiceAndCaptions, AudioCaptionAsset } from './ttsCaptionsGenerator.js';
import { selectBackgroundMusic, MusicTrackConfig } from './musicSelector.js';
import { assembleShortVideo, verifyOutputVideo, VerificationResult } from './ffmpegAssembly.js';

export interface PipelineExecutionResult {
  moderation: ModerationResult;
  styleProfile: StyleProfile;
  script: GeneratedScript;
  visuals: VisualFrameAsset[];
  audioCaptions: AudioCaptionAsset;
  musicConfig: MusicTrackConfig;
}

export function executeAiPipeline(jobId: string, prompt: string): PipelineExecutionResult {
  // 1. Content Moderation
  const moderation = checkSafety(prompt);
  if (!moderation.isSafe) {
    throw new Error(moderation.reason || 'Content policy violation.');
  }

  // 2. Style Analysis (Anime vs Realistic)
  const styleProfile = analyzeStyle(prompt);

  // 3. Script & Storyboard generation (Hook in 3s, 9 scenes summing to 60.00s)
  const script = generateScript(prompt, styleProfile);

  // 4. Visual Keyframe Generation in 9:16 safe-zone framing
  const visuals = generateSceneVisuals(jobId, script.scenes, styleProfile);

  // 5. Voiceover & Word-Highlighted Subtitles (.ass)
  const audioCaptions = generateVoiceAndCaptions(jobId, script.scenes, styleProfile);

  // 6. Background Music Selection & Ducking Configuration
  const musicConfig = selectBackgroundMusic(prompt, styleProfile);

  return {
    moderation,
    styleProfile,
    script,
    visuals,
    audioCaptions,
    musicConfig
  };
}

export * from './moderation.js';
export * from './styleClassifier.js';
export * from './scriptGenerator.js';
export * from './visualsGenerator.js';
export * from './ttsCaptionsGenerator.js';
export * from './musicSelector.js';
export * from './ffmpegAssembly.js';

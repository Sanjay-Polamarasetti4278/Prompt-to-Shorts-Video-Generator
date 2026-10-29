import fs from 'fs';
import path from 'path';
import { StoryboardScene } from '../types.js';
import { StyleProfile } from './styleClassifier.js';
import { STORAGE_DIR } from '../services/storage.js';

export interface VisualFrameAsset {
  sceneNumber: number;
  filePath: string;
  width: number; // 1080
  height: number; // 1920
  aspectRatio: '9:16';
  cameraMovement: string;
}

export function generateSceneVisuals(
  jobId: string, 
  scenes: StoryboardScene[], 
  styleProfile: StyleProfile
): VisualFrameAsset[] {
  const jobSceneDir = path.join(STORAGE_DIR, 'scenes', jobId);
  if (!fs.existsSync(jobSceneDir)) {
    fs.mkdirSync(jobSceneDir, { recursive: true });
  }

  const isAnime = styleProfile.style === 'anime';

  return scenes.map((scene) => {
    const filename = `scene_${scene.sceneNumber}.svg`;
    const filePath = path.join(jobSceneDir, filename);

    // Build native 1080x1920 SVG frame strictly compliant with 9:16 and safe zones
    const svgContent = createSceneSvg(scene, styleProfile, isAnime);
    fs.writeFileSync(filePath, svgContent);

    return {
      sceneNumber: scene.sceneNumber,
      filePath,
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      cameraMovement: scene.cameraMovement
    };
  });
}

function createSceneSvg(scene: StoryboardScene, style: StyleProfile, isAnime: boolean): string {
  const primaryColor = isAnime ? '#f43f5e' : '#38bdf8';
  const secondaryColor = isAnime ? '#a855f7' : '#10b981';
  const bgGradStart = isAnime ? '#180728' : '#07162c';
  const bgGradEnd = isAnime ? '#090210' : '#020b18';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${bgGradStart}" />
      <stop offset="50%" stop-color="${isAnime ? '#2e0854' : '#0f2744'}" />
      <stop offset="100%" stop-color="${bgGradEnd}" />
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.35" />
      <stop offset="70%" stop-color="${secondaryColor}" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="25" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full Bleed 9:16 Background (No letterboxing) -->
  <rect width="1080" height="1920" fill="url(#bgGrad)" />
  <rect width="1080" height="1920" fill="url(#centerGlow)" />

  <!-- Background Ambience & Particles -->
  <g opacity="0.4">
    <circle cx="200" cy="400" r="140" fill="${primaryColor}" opacity="0.15" filter="url(#glow)" />
    <circle cx="880" cy="1100" r="180" fill="${secondaryColor}" opacity="0.15" filter="url(#glow)" />
    <circle cx="540" cy="750" r="280" fill="#ffffff" opacity="0.05" />
  </g>

  <!-- SAFE ZONE TOP (0 to 192px): Header Branding Only -->
  <g id="safe-zone-top">
    <rect x="340" y="70" width="400" height="48" rx="24" fill="rgba(0,0,0,0.6)" stroke="${primaryColor}" stroke-opacity="0.5" stroke-width="2" />
    <text x="540" y="102" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">
      ${style.style.toUpperCase()} • SCENE ${scene.sceneNumber} OF 9
    </text>
  </g>

  <!-- SAFE ZONE CENTER (192px to 1536px): Hero Visual Artwork -->
  <g id="safe-zone-center" transform="translate(0, 0)">
    <!-- Central Art Frame -->
    <rect x="80" y="320" width="920" height="1020" rx="36" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
    
    <!-- Stylized Focal Hero Graphic -->
    <circle cx="540" cy="760" r="220" fill="${isAnime ? 'rgba(236,72,153,0.2)' : 'rgba(56,189,248,0.2)'}" stroke="${primaryColor}" stroke-width="4" filter="url(#glow)" />
    
    <!-- Hero Icon Motif -->
    <text x="540" y="780" font-family="system-ui, sans-serif" font-size="110" font-weight="900" fill="#ffffff" text-anchor="middle">
      ${isAnime ? '⚔️' : '🎬'}
    </text>

    <!-- Scene Information Card Inside Safe Zone -->
    <rect x="140" y="1060" width="800" height="200" rx="20" fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
    <text x="540" y="1120" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="${primaryColor}" text-anchor="middle">
      Camera: ${scene.cameraMovement.toUpperCase()}
    </text>
    <text x="540" y="1170" font-family="system-ui, sans-serif" font-size="24" fill="#e4e4e7" text-anchor="middle">
      Duration: ${scene.durationSeconds.toFixed(1)}s • 1080x1920 (9:16)
    </text>
    <text x="540" y="1215" font-family="system-ui, sans-serif" font-size="18" fill="#a1a1aa" text-anchor="middle">
      Palette: ${style.colorPalette}
    </text>
  </g>

  <!-- SAFE ZONE LOWER MIDDLE (1380px to 1536px): Word-Level Subtitle Preview Area -->
  <g id="safe-zone-subtitles">
    <rect x="60" y="1380" width="960" height="150" rx="24" fill="rgba(0,0,0,0.85)" stroke="${secondaryColor}" stroke-opacity="0.4" stroke-width="2" />
    <text x="540" y="1450" font-family="system-ui, sans-serif" font-size="34" font-weight="bold" fill="#fde047" text-anchor="middle">
      "${scene.narration.slice(0, 48)}"
    </text>
    <text x="540" y="1495" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">
      "${scene.narration.slice(48, 96)}"
    </text>
  </g>

  <!-- SAFE ZONE BOTTOM (1536px to 1920px): Reserved for Shorts/Reels Actions -->
  <g id="safe-zone-bottom">
    <text x="540" y="1850" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="rgba(255,255,255,0.3)" text-anchor="middle" letter-spacing="3">
      PROMPT-TO-SHORTS • 60.00S MASTER
    </text>
  </g>
</svg>`;
}

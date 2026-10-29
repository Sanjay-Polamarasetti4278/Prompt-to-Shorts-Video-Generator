import { VideoStyle, StoryboardScene } from '../types.js';

const BANNED_PATTERNS = [
  'deepfake', 'nsfw', 'porn', 'nude', 'hate speech', 'gore', 'beheading', 
  'suicide', 'bomb recipe', 'mickey mouse', 'iron man', 'spider-man'
];

export function validatePromptSafety(prompt: string): { isSafe: boolean; reason?: string } {
  const lower = prompt.toLowerCase();
  for (const term of BANNED_PATTERNS) {
    if (lower.includes(term)) {
      return {
        isSafe: false,
        reason: `Your prompt contains restricted or copyrighted content ("${term}"). Please revise to comply with policy.`
      };
    }
  }
  return { isSafe: true };
}

export function classifyStyle(prompt: string): { style: VideoStyle; confidence: number; reason: string } {
  const lower = prompt.toLowerCase();

  // Explicit keyword override (FR-7)
  if (lower.includes('anime') || lower.includes('manga') || lower.includes('ghibli') || lower.includes('shonen') || lower.includes('animated')) {
    return {
      style: 'anime',
      confidence: 99,
      reason: 'Explicit anime keyword detected in prompt'
    };
  }

  if (lower.includes('realistic') || lower.includes('real life') || lower.includes('photoreal') || lower.includes('cinematic') || lower.includes('documentary') || lower.includes('live action')) {
    return {
      style: 'realistic',
      confidence: 98,
      reason: 'Explicit realistic keyword detected in prompt'
    };
  }

  // Heuristic genre detection (FR-6)
  const animeKeywords = ['cyberpunk', 'magic', 'dragon', 'powers', 'ninja', 'mecha', 'isekai', 'space warrior', 'superhero', 'fantasy'];
  const realisticKeywords = ['business', 'history', 'science', 'ocean', 'ancient rome', 'nature', 'cooking', 'finance', 'workout', 'daily routine', 'travel', 'interview'];

  const animeScore = animeKeywords.reduce((acc, k) => acc + (lower.includes(k) ? 1 : 0), 0);
  const realisticScore = realisticKeywords.reduce((acc, k) => acc + (lower.includes(k) ? 1 : 0), 0);

  if (animeScore > realisticScore) {
    return {
      style: 'anime',
      confidence: 86,
      reason: 'Fantasy/Sci-Fi themes mapped to anime aesthetic'
    };
  }

  return {
    style: 'realistic',
    confidence: 88,
    reason: 'Documentary & real-world cues classified as realistic'
  };
}

export function buildStoryboard(prompt: string, style: VideoStyle): StoryboardScene[] {
  const isAnime = style === 'anime';

  // 9 scenes strictly summing to 60.00s (FR-11): 4.0 + 6.0 + 7.0 + 7.0 + 7.0 + 7.0 + 7.0 + 8.0 + 7.0 = 60.00s
  const durations = [4.0, 6.0, 7.0, 7.0, 7.0, 7.0, 7.0, 8.0, 7.0];

  const animeHooks = [
    "What if everything you believed about this universe was a crafted lie?",
    "Deep in the cyber-districts, an anomaly emerged from the data stream.",
    "Legend spoke of an ancient artifact buried beneath the monolithic core.",
    "When activated, reality bent into impossible fractal geometries.",
    "Guardians of the forgotten code awakened to protect the breach.",
    "Every second pushed humanity closer to the ultimate breakthrough.",
    "The synchronization reached critical frequency across the neural link.",
    "And in that singular instant, a new era exploded into existence.",
    "Follow for more legendary animated stories every single day."
  ];

  const realisticHooks = [
    "Did you know that 99% of people misunderstand this one critical truth?",
    "In the heart of the deepest oceanic trenches, temperatures reach extremes.",
    "Scientists discovered geological vents powering ecosystems without sunlight.",
    "Microorganisms here thrive on pure sulfur and geothermal heat.",
    "This single phenomenon changed our search for extraterrestrial life.",
    "If life can emerge here, it can exist virtually anywhere in the cosmos.",
    "Modern exploration is just scratching the surface of what lies beneath.",
    "Every secret uncovered redefines our understanding of existence itself.",
    "Subscribe to unlock daily fascinating discoveries across the globe."
  ];

  const hooks = isAnime ? animeHooks : realisticHooks;
  const cameraMovements = ['slow zoom in', 'dynamic pan right', 'low-angle tilt up', 'dramatic tracking', 'parallax push'];

  return durations.map((duration, i) => ({
    sceneNumber: i + 1,
    durationSeconds: duration,
    narration: hooks[i],
    visualPrompt: `[${style.toUpperCase()} 9:16] Scene ${i + 1}: ${hooks[i]} [Subject: ${prompt.slice(0, 35)}]`,
    cameraMovement: cameraMovements[i % cameraMovements.length],
    colorPalette: isAnime ? 'Neon Magenta, Violet, Cyber Blue' : 'Natural Amber, Deep Teal, Golden Hour'
  }));
}

import { VideoStyle } from '../types.js';

export interface StyleProfile {
  style: VideoStyle;
  confidence: number;
  reason: string;
  artStyle: string;
  colorPalette: string;
  lightingScheme: string;
  characterAnchor: string;
}

export function analyzeStyle(prompt: string): StyleProfile {
  const lower = prompt.toLowerCase();

  // 1. Explicit keyword override (FR-7)
  const explicitAnimeKeywords = [
    'anime', 'manga', 'studio ghibli', 'ghibli', 'shonen', 'otaku', 
    'makoto shinkai', 'cel-shaded', 'animated', 'cartoon'
  ];
  const explicitRealisticKeywords = [
    'realistic', 'real life', 'photoreal', 'photorealistic', 'cinematic', 
    'documentary', 'live action', 'hyperrealistic', '35mm footage'
  ];

  for (const kw of explicitAnimeKeywords) {
    if (lower.includes(kw)) {
      return {
        style: 'anime',
        confidence: 99,
        reason: `Explicit style keyword "${kw}" detected in prompt`,
        artStyle: 'High-energy modern Japanese anime with dynamic line art and vibrant glows',
        colorPalette: 'Electric Violet, Neon Magenta, Cyber Cyan, and Midnight Blue',
        lightingScheme: 'Volumetric neon rim lighting with high-contrast specular reflections',
        characterAnchor: 'Distinctive animated protagonist with expressive eyes, sharp stylized silhouette, and iconic clothing accents'
      };
    }
  }

  for (const kw of explicitRealisticKeywords) {
    if (lower.includes(kw)) {
      return {
        style: 'realistic',
        confidence: 99,
        reason: `Explicit style keyword "${kw}" detected in prompt`,
        artStyle: 'Photorealistic 35mm cinematic footage with natural depth of field and authentic physical textures',
        colorPalette: 'Cinematic Amber, Deep Slate, Forest Jade, and Warm Golden Hour tones',
        lightingScheme: 'Natural daylight diffusion with realistic ambient occlusion and soft directional key light',
        characterAnchor: 'Authentic human subject with natural facial features, organic skin texture, and real-world attire'
      };
    }
  }

  // 2. Heuristic genre & subject classifier (FR-6)
  const animeIndicators = [
    'cyberpunk', 'magic', 'dragon', 'powers', 'ninja', 'mecha', 'isekai', 
    'superhero', 'fantasy', 'space warrior', 'sorcerer', 'dungeon', 'samurai',
    'apocalypse', 'demon', 'spirit'
  ];
  const realisticIndicators = [
    'history', 'ancient rome', 'ocean', 'deep sea', 'science', 'nature', 
    'business', 'cooking', 'workout', 'fitness', 'daily routine', 'travel', 
    'interview', 'wildlife', 'architecture', 'space exploration', 'astronomy',
    'meditation', 'psychology'
  ];

  const animeScore = animeIndicators.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);
  const realisticScore = realisticIndicators.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);

  if (animeScore > realisticScore) {
    return {
      style: 'anime',
      confidence: 88,
      reason: 'Fantasy/Sci-Fi genre cues mapped to anime visual language',
      artStyle: 'Polished digital anime illustration with glowing particles and cinematic camera angles',
      colorPalette: 'Deep Indigo, Vivid Fuchsia, Radiant Gold, and Deep Shadow',
      lightingScheme: 'Dramatic backlighting with ethereal bioluminescent energy glows',
      characterAnchor: 'Heroic stylized protagonist with consistent costume details, color motif, and posture'
    };
  }

  // Default to realistic for real-world explainers, human subjects, science
  return {
    style: 'realistic',
    confidence: 90,
    reason: 'Documentary and real-world thematic cues mapped to realistic style',
    artStyle: 'Crisp 4K documentary cinematography with true-to-life color grading',
    colorPalette: 'Warm Earth, Cinematic Cyan, Natural Skin Tones, and Golden Highlights',
    lightingScheme: 'Directional cinematic sun flare with balanced fill light',
    characterAnchor: 'Realistic central subject captured with consistent wardrobe and natural environment interaction'
  };
}

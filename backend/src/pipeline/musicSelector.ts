import { StyleProfile } from './styleClassifier.js';

export interface MusicTrackConfig {
  trackName: string;
  genre: string;
  tempoBpm: number;
  mood: string;
  royaltyFreeLicense: string;
  vocalLoudnessTarget: string; // -16 LUFS (FR-17)
  musicDuckedDb: number; // -24 dB
  musicRestingDb: number; // -18 dB
  sidechainAttackMs: number; // 20ms
  sidechainReleaseMs: number; // 250ms
}

export function selectBackgroundMusic(prompt: string, styleProfile: StyleProfile): MusicTrackConfig {
  const isAnime = styleProfile.style === 'anime';

  if (isAnime) {
    return {
      trackName: 'Neon Cyber-Pulse (Cyberpunk Synthwave Orchestra)',
      genre: 'Synthwave / Anime Battle OST',
      tempoBpm: 128,
      mood: 'Epic, Kinetic, Heroic',
      royaltyFreeLicense: 'Creative Commons 0 / Commercial Cleared',
      vocalLoudnessTarget: '-16 LUFS',
      musicDuckedDb: -24,
      musicRestingDb: -18,
      sidechainAttackMs: 20,
      sidechainReleaseMs: 250
    };
  }

  return {
    trackName: 'Deep Horizons (Ambient Cinematic Documentary Score)',
    genre: 'Cinematic Neoclassical / Documentary Ambient',
    tempoBpm: 92,
    mood: 'Contemplative, Wonder, High Tension',
    royaltyFreeLicense: 'Creative Commons 0 / Commercial Cleared',
    vocalLoudnessTarget: '-16 LUFS',
    musicDuckedDb: -26,
    musicRestingDb: -19,
    sidechainAttackMs: 25,
    sidechainReleaseMs: 300
  };
}

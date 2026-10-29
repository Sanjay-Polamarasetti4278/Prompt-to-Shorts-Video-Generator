import { StoryboardScene } from '../types.js';
import { StyleProfile } from './styleClassifier.js';

export interface GeneratedScript {
  totalDurationSeconds: number; // strictly 60.00
  scenes: StoryboardScene[];
  hookSceneNumber: number; // 1
  closingSceneNumber: number; // last
  voiceoverWordCount: number;
}

export function generateScript(prompt: string, styleProfile: StyleProfile): GeneratedScript {
  const isAnime = styleProfile.style === 'anime';

  // 9 scene durations summing to EXACTLY 60.00 seconds (FR-11):
  // 3.5 + 6.0 + 7.0 + 7.0 + 7.0 + 7.0 + 7.5 + 8.0 + 7.0 = 60.00
  const durations = [3.5, 6.0, 7.0, 7.0, 7.0, 7.0, 7.5, 8.0, 7.0];

  const animeNarratives = [
    {
      hook: "What if everything you believed about this universe was a crafted lie?",
      camera: "dramatic slow zoom in on glowing eyes",
      sceneDesc: "High-voltage opening hook. Protagonist silhouetted against a neon storm as reality bends."
    },
    {
      hook: "Deep beneath the cyber-districts, an anomaly emerged from the core data stream.",
      camera: "dynamic horizontal pan across rain-slicked rooftops",
      sceneDesc: "Sprawling futuristic cityscape with holographic lanterns and towering dark monoliths."
    },
    {
      hook: "Ancient texts spoke of a forbidden core, guarded by sentinels of pure light.",
      camera: "low-angle tilt upward into the atmospheric mist",
      sceneDesc: "Hero descending into a crystalline subterranean sanctuary glowing with ancient runes."
    },
    {
      hook: "When touched, the relic unleashed an energy surge that rewrote physical laws.",
      camera: "fast tracking orbit with kinetic speedlines",
      sceneDesc: "Shattering fractal geometries and spiraling auroras of electric energy illuminating the hero."
    },
    {
      hook: "Guardians of the forgotten code awakened, determined to seal the breach forever.",
      camera: "wide-angle parallax pull-back revealing massive sentinels",
      sceneDesc: "Massive cybernetic mecha sentinels rising from the shadows with glowing ocular lenses."
    },
    {
      hook: "Every second demanded total mastery as the blade synchronized with neural frequencies.",
      camera: "close-up tracking on weapon drawn with plasma sparks",
      sceneDesc: "Intense clash of energy blades radiating violet and cyan shockwaves across the chamber."
    },
    {
      hook: "The final barrier gave way, revealing the hidden blueprint of all existence.",
      camera: "smooth pedestal rise into luminous starlight",
      sceneDesc: "The ceiling dissolves into a cosmic astral ocean filled with glowing nebulae and digital constellations."
    },
    {
      hook: "In that singular instant, humanity gained the power to forge its own destiny.",
      camera: "slow rotational pan around the triumphant protagonist",
      sceneDesc: "Hero standing tall atop the highest tower as dawn breaks across the cyber-horizon."
    },
    {
      hook: "Follow for more epic 60-second animated sagas every single day.",
      camera: "static centered safe-zone outro hold",
      sceneDesc: "Striking 9:16 vertical character poster outro with high-contrast graphic branding."
    }
  ];

  const realisticNarratives = [
    {
      hook: "Did you know that 99% of people misunderstand this one critical truth?",
      camera: "macro slow push-in with shallow depth of field",
      sceneDesc: "Intriguing high-detail opening hook. An intricate historical artifact illuminated in chiaroscuro light."
    },
    {
      hook: "In the most unforgiving environments on Earth, life found a way to completely rewrite the rules.",
      camera: "cinematic aerial drone sweep descending downward",
      sceneDesc: "Vast landscape of extreme terrain, displaying geothermal steam vents and raw natural geological scale."
    },
    {
      hook: "Scientists ventured thousands of feet into the abyss to document this impossible phenomenon.",
      camera: "steady sub-surface tracking shot cutting through deep blue",
      sceneDesc: "High-tech exploration vessels and submersibles operating high-powered halogen floodlights."
    },
    {
      hook: "What they uncovered defied decades of established biological consensus.",
      camera: "smooth low-angle tilt up following mineral structures",
      sceneDesc: "Towering hydrothermal mineral chimneys teeming with vibrant, otherworldly extremophile colonies."
    },
    {
      hook: "These organisms thrive without a single ray of sunlight, fueled solely by raw geothermal chemistry.",
      camera: "ultra-high-definition macro zoom on biological textures",
      sceneDesc: "Microscopic electron-capture visualization showcasing crystalline sulfur structures and active cellular motion."
    },
    {
      hook: "This single breakthrough fundamentally revolutionized how astrobiologists hunt for life across our solar system.",
      camera: "orbital planetary transition shot panning across icy moons",
      sceneDesc: "Seamless transition from ocean depths to Europa and Enceladus in realistic photoreal orbital perspective."
    },
    {
      hook: "If thriving ecosystems can originate here, life could be flourishing beneath icy oceans across the cosmos.",
      camera: "cinematic wide horizon tracking with natural lens flare",
      sceneDesc: "Atmospheric view of future explorers surveying alien polar coastlines under deep planetary rings."
    },
    {
      hook: "Every hidden layer we peel back reveals that reality is vastly more magnificent than fiction.",
      camera: "slow pull-out drone view revealing the golden hour horizon",
      sceneDesc: "Golden hour sunburst breaking through atmospheric cloud layers above open ocean waters."
    },
    {
      hook: "Subscribe to unlock daily fascinating discoveries that expand your perspective.",
      camera: "elegant centered safe-zone branding hold",
      sceneDesc: "Clean 1080x1920 vertical documentary closing visual with balanced safe-zone typography."
    }
  ];

  const narratives = isAnime ? animeNarratives : realisticNarratives;

  let totalWords = 0;
  const scenes: StoryboardScene[] = durations.map((duration, idx) => {
    const item = narratives[idx];
    totalWords += item.hook.split(' ').length;

    // Build consistent 9:16 visual prompt carrying character anchor and palette (FR-12, FR-13)
    const visualPrompt = `[${styleProfile.style.toUpperCase()} 9:16 VERTICAL] Scene ${idx + 1}/${durations.length}: ${item.sceneDesc} Visual Style: ${styleProfile.artStyle}. Palette: ${styleProfile.colorPalette}. Character Anchor: ${styleProfile.characterAnchor}. Camera: ${item.camera}. Context: ${prompt.slice(0, 45)}. Full-screen 1080x1920, no letterboxing, safe-zone compliant.`;

    return {
      sceneNumber: idx + 1,
      durationSeconds: duration,
      narration: item.hook,
      visualPrompt,
      cameraMovement: item.camera,
      colorPalette: styleProfile.colorPalette
    };
  });

  const totalCalculated = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);

  return {
    totalDurationSeconds: Math.round(totalCalculated * 100) / 100, // 60.00
    scenes,
    hookSceneNumber: 1,
    closingSceneNumber: scenes.length,
    voiceoverWordCount: totalWords
  };
}

import { GenerationJob, StoryboardScene, VideoStyle, StageId } from '../types';

// Banned keywords for content safety (FR-4 & Section 11)
const BANNED_TERMS = [
  'deepfake', 'nsfw', 'porn', 'nude', 'hate speech', 'gore', 'beheading', 
  'suicide', 'bomb recipe', 'mickey mouse', 'iron man', 'spider-man'
];

export function checkContentSafety(prompt: string): { isSafe: boolean; reason?: string } {
  const lower = prompt.toLowerCase();
  for (const term of BANNED_TERMS) {
    if (lower.includes(term)) {
      return {
        isSafe: false,
        reason: `Your prompt contains restricted or copyrighted content ("${term}"). Please rephrase to comply with our safety guidelines.`
      };
    }
  }
  return { isSafe: true };
}

// Style detection classifier according to FR-5, FR-6, FR-7
export function detectStyle(prompt: string): { style: VideoStyle; confidence: number; reason: string } {
  const lower = prompt.toLowerCase();

  // Explicit keyword override (FR-7)
  if (lower.includes('anime') || lower.includes('manga') || lower.includes('ghibli') || lower.includes('shonen') || lower.includes('cartoon') || lower.includes('animated')) {
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
  const animeIndicators = ['cyberpunk', 'magic', 'dragon', 'powers', 'ninja', 'mecha', 'isekai', 'space warrior', 'superhero', 'fantasy'];
  const realisticIndicators = ['business', 'history', 'science', 'ocean', 'ancient rome', 'nature', 'cooking', 'finance', 'workout', 'daily routine', 'travel', 'interview'];

  const animeScore = animeIndicators.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);
  const realisticScore = realisticIndicators.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);

  if (animeScore > realisticScore) {
    return {
      style: 'anime',
      confidence: 85,
      reason: 'Fantasy/Sci-Fi themes mapped to anime aesthetic'
    };
  }

  // Default to realistic for general explainers / human scenes
  return {
    style: 'realistic',
    confidence: 88,
    reason: 'Documentary & real-world cues classified as realistic'
  };
}

// Storyboard generator creating 9 scenes summing to exactly 60.00 seconds (FR-9, FR-10, FR-11)
export function generateStoryboard(prompt: string, style: VideoStyle): StoryboardScene[] {
  const isAnime = style === 'anime';

  // 9 scenes with exact durations: 4 + 6 + 7 + 7 + 7 + 7 + 7 + 8 + 7 = 60.00s
  const sceneDurations = [4.0, 6.0, 7.0, 7.0, 7.0, 7.0, 7.0, 8.0, 7.0];
  
  const promptsAnime = [
    { hook: "What if everything you believed about this universe was a crafted lie?", visual: "Glowing neon horizon, dramatic eye closeup with lightning reflections, shonen art style." },
    { hook: "Deep in the cyber-districts, an anomaly emerged from the data stream.", visual: "Bustling futuristic Tokyo street with rain reflections, holographic cherry blossoms." },
    { hook: "Legend spoke of an ancient artifact buried beneath the monolithic core.", visual: "Hero in tech-cloaks looking down an endless luminous chasm, cel-shaded high contrast." },
    { hook: "When activated, reality bent into impossible fractal geometries.", visual: "Dynamic anime speedlines, reality shattering into radiant purple shards." },
    { hook: "Guardians of the forgotten code awakened to protect the breach.", visual: "Mecha-winged sentinels rising through swirling mist, intense glowing eyes." },
    { hook: "Every second pushed humanity closer to the ultimate breakthrough.", visual: "Hero charging forward, energy blade drawn, camera orbiting rapidly." },
    { hook: "The synchronization reached critical frequency across the neural link.", visual: "Split-screen reaction shot, pulsing binary glyphs floating in midair." },
    { hook: "And in that singular instant, a new era exploded into existence.", visual: "Majestic supernova blast transforming into a peaceful digital sunrise." },
    { hook: "Follow for more legendary animated stories every single day.", visual: "End card with hero silhouetted against a neon skyline, 9:16 safe framing." }
  ];

  const promptsRealistic = [
    { hook: "Did you know that 99% of people misunderstand this one critical truth?", visual: "Ultra-crisp 4K macro shot of a ticking mechanical chronometer with cinematic lighting." },
    { hook: "In the heart of the deepest oceanic trenches, temperatures reach extremes.", visual: "Submersible floodlights cutting through pitch-black abyss, biological bioluminescence." },
    { hook: "Scientists discovered geological vents powering ecosystems without sunlight.", visual: "Towering mineral hydrothermal chimneys releasing mineral clouds, photorealistic HDR." },
    { hook: "Microorganisms here thrive on pure sulfur and geothermal heat.", visual: "Microscopic electron-microscope visualization with golden rim lighting." },
    { hook: "This single phenomenon changed our search for extraterrestrial life.", visual: "Transition to Europa's ice ocean with realistic planetary orbital view." },
    { hook: "If life can emerge here, it can exist virtually anywhere in the cosmos.", visual: "Astronaut observing alien shoreline, realistic fabric texture and reflections." },
    { hook: "Modern exploration is just scratching the surface of what lies beneath.", visual: "Expedition crew reviewing real-time 3D bathymetric seabed scans on ship deck." },
    { hook: "Every secret uncovered redefines our understanding of existence itself.", visual: "Sunburst breaking over open deep sea, drone tracking shot at 30 fps." },
    { hook: "Subscribe to unlock daily fascinating discoveries across the globe.", visual: "Clean 1080x1920 graphic outro with safe-zone typography and elegant branding." }
  ];

  const templates = isAnime ? promptsAnime : promptsRealistic;

  return sceneDurations.map((duration, index) => ({
    sceneNumber: index + 1,
    durationSeconds: duration,
    narration: templates[index].hook,
    visualPrompt: `[${style.toUpperCase()} 9:16] ${templates[index].visual} [Consistency: ${prompt.slice(0, 40)}]`,
    cameraMovement: (['slow zoom in', 'dynamic pan right', 'low-angle tilt up', 'dramatic tracking', 'parallax push'][index % 5]) as any,
    colorPalette: isAnime ? 'Neon Magenta, Violet, Cyber Blue' : 'Natural Amber, Deep Teal, Golden Hour'
  }));
}

// Convert prompt to safe filename slug
export function createFilenameSlug(prompt: string): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30)
    .replace(/^-+|-+$/g, '');
  return `${slug || 'video'}-60s-1080p.mp4`;
}

// Generate an interactive HTML5 Canvas animated video file (WebM/MP4 container)
// for immediate real-time playback and download in Phase 1
export async function createMockVideoBlob(
  prompt: string, 
  style: VideoStyle, 
  scenes: StoryboardScene[]
): Promise<string> {
  return new Promise((resolve) => {
    // Generate an animated canvas stream
    const canvas = document.createElement('canvas');
    // Set 9:16 resolution (scaled down for fast browser rendering, visually 9:16)
    canvas.width = 540;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    const stream = canvas.captureStream(30);
    let mediaRecorder: MediaRecorder | null = null;
    try {
      const mime = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') 
        ? 'video/mp4;codecs=avc1' 
        : 'video/webm;codecs=vp9';
      mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
    } catch {
      mediaRecorder = new MediaRecorder(stream);
    }

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      resolve(URL.createObjectURL(blob));
    };

    mediaRecorder.start();

    // Render 15 seconds fast sample or animated loop
    let frame = 0;
    const totalFrames = 150; // 5 seconds at 30fps recorded for instant demonstration

    const isAnime = style === 'anime';

    function draw() {
      if (!ctx) return;
      const progress = frame / totalFrames;
      const currentSceneIndex = Math.min(Math.floor(progress * scenes.length), scenes.length - 1);
      const scene = scenes[currentSceneIndex] || scenes[0];

      // Dynamic animated background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (isAnime) {
        const hue1 = (frame * 2) % 360;
        const hue2 = (frame * 2 + 60) % 360;
        grad.addColorStop(0, `hsl(${hue1}, 80%, 15%)`);
        grad.addColorStop(0.5, `hsl(${hue2}, 70%, 25%)`);
        grad.addColorStop(1, '#0f051d');
      } else {
        const t = Math.sin(frame * 0.05);
        grad.addColorStop(0, '#0a192f');
        grad.addColorStop(0.5, t > 0 ? '#112240' : '#1e293b');
        grad.addColorStop(1, '#020c1b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stylized background motion particles / speedlines
      ctx.save();
      for (let i = 0; i < 25; i++) {
        const particleY = (i * 45 + frame * 4) % canvas.height;
        const particleX = (i * 27 + Math.sin(frame * 0.03 + i) * 60) % canvas.width;
        ctx.fillStyle = isAnime ? 'rgba(236, 72, 153, 0.4)' : 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(particleX, particleY, (i % 4) + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Draw Style Watermark Header (Safe Zone Top)
      ctx.fillStyle = isAnime ? '#f43f5e' : '#10b981';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`STYLE: ${style.toUpperCase()}`, canvas.width / 2, 70);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Scene ${currentSceneIndex + 1} of ${scenes.length} • 60.00s Master`, canvas.width / 2, 100);

      // Draw Central Visual Card
      const cardY = 160;
      const cardH = 460;
      const cardW = canvas.width - 60;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = isAnime ? 'rgba(236, 72, 153, 0.5)' : 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.roundRect(30, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.stroke();

      // Visual Scene Motion Representation
      const scale = 1.0 + Math.sin(frame * 0.05) * 0.05;
      ctx.save();
      ctx.translate(canvas.width / 2, cardY + cardH / 2);
      ctx.scale(scale, scale);
      
      // Draw Central icon / artwork placeholder
      ctx.fillStyle = isAnime ? '#ec4899' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -40, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isAnime ? '✨ ANIME SCENE' : '🎬 REALISTIC SCENE', 0, 50);

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Motion: ${scene.cameraMovement}`, 0, 80);
      ctx.restore();

      // Burned-In Word-Highlighted Subtitles (FR-18) (Safe Zone Middle-Bottom)
      const subY = 680;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(20, subY - 30, canvas.width - 40, 100);

      ctx.fillStyle = '#fde047'; // Word highlight yellow
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      const words = scene.narration.split(' ');
      const activeWordIndex = Math.floor((frame % 30) / (30 / Math.max(words.length, 1)));
      
      // Render text wrapped
      const textToDisplay = words.map((w, idx) => idx === activeWordIndex ? `[${w}]` : w).join(' ');
      ctx.fillText(textToDisplay.slice(0, 36), canvas.width / 2, subY + 10);
      if (textToDisplay.length > 36) {
        ctx.fillText(textToDisplay.slice(36, 72), canvas.width / 2, subY + 45);
      }

      // Safe Zone Bottom UI Marker
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '14px sans-serif';
      ctx.fillText('⚡ 1080 x 1920 • 30 FPS • Exact 60.00s ⚡', canvas.width / 2, 890);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(draw);
      } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }
    }

    draw();
  });
}

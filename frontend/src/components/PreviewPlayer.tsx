import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  ListOrdered, 
  Check, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { GenerationJob } from '../types';

interface PreviewPlayerProps {
  job: GenerationJob;
  onReset: () => void;
  onOpenStoryboard: () => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({ 
  job, 
  onReset, 
  onOpenStoryboard 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleDownload = () => {
    if (!job.outputVideoUrl) return;
    const a = document.createElement('a');
    a.href = job.outputVideoUrl;
    a.download = job.outputFileName || 'prompt-to-shorts-60s-1080p.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-400">
      {/* Success Banner & Style Confirmation (FR-8) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                Your 60-Second Short is Ready
              </h2>
              {/* FR-8 Style Label */}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                job.detectedStyle === 'anime'
                  ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
              }`}>
                Style: {job.detectedStyle}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Output: 1080x1920 • 9:16 • 30 FPS • Exactly 60.00s Duration
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStoryboard}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
          >
            <ListOrdered className="w-3.5 h-3.5 text-pink-400" />
            <span>View Storyboard ({job.scenes.length} Scenes)</span>
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Video</span>
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: 9:16 Vertical Phone Mockup Player */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-[2.5rem] bg-black p-3.5 shadow-2xl ring-1 ring-white/10 glow-box">
            
            {/* Phone Bezel Speaker Notch */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-900 rounded-full z-30 flex items-center justify-center">
              <div className="w-8 h-1 rounded-full bg-zinc-800" />
            </div>

            {/* Video Screen Container */}
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-zinc-950 flex items-center justify-center">
              {job.outputVideoUrl ? (
                <video
                  ref={videoRef}
                  src={job.outputVideoUrl}
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <div className="text-zinc-500 text-xs">No video source</div>
              )}

              {/* Safe Zones Overlay (FR-15) */}
              {showSafeZones && (
                <div className="absolute inset-0 z-20 flex flex-col justify-between safe-zone-overlay">
                  {/* Top 10% YouTube / IG Reels Header Zone */}
                  <div className="h-[12%] w-full safe-zone-danger p-2 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded">
                      Top 10% UI Zone (Story Bars / Account)
                    </span>
                  </div>

                  {/* Middle 70% Safe Action & Subtitle Area */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-widest border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 rounded">
                      ✓ Safe Zone: Captions & Subject
                    </span>
                  </div>

                  {/* Bottom 20% YouTube / IG Reels Title & Buttons Zone */}
                  <div className="h-[22%] w-full safe-zone-danger p-2 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded">
                      Bottom 20% UI Zone (Caption / Audio / Actions)
                    </span>
                  </div>
                </div>
              )}

              {/* On-Player Floating Controls */}
              <div className="absolute bottom-4 left-4 right-4 z-25 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition border border-white/20 active:scale-90"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition border border-white/20 active:scale-90"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={() => setShowSafeZones(!showSafeZones)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md border transition flex items-center gap-1.5 ${
                    showSafeZones
                      ? 'bg-red-500 text-white border-red-400'
                      : 'bg-black/70 text-zinc-200 border-white/20 hover:bg-black'
                  }`}
                  title="Toggle YouTube Shorts / Reels UI Safe Zones (FR-15)"
                >
                  {showSafeZones ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>Safe Zones</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Spec Sheet & 1080p Download Button (FR-21, FR-22, FR-23) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
                Export Details
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Generated strictly according to the PRD 60.00s YouTube Shorts / Reels spec.
              </p>
            </div>

            {/* Spec Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block">Duration</span>
                <strong className="text-white text-sm font-mono">60.00 Seconds</strong>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block">Resolution</span>
                <strong className="text-white text-sm font-mono">1080 x 1920 (9:16)</strong>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block">Framerate & Codec</span>
                <strong className="text-white text-sm font-mono">30 FPS • H.264 / AAC</strong>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block">Detected Style</span>
                <strong className="text-white text-sm font-mono capitalize">{job.detectedStyle}</strong>
              </div>
            </div>

            {/* File Name Spec */}
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono text-xs text-zinc-300 break-all">
              <span className="text-zinc-500 block mb-1">Target Filename (FR-23):</span>
              <span className="text-pink-400 font-bold">{job.outputFileName}</span>
            </div>

            {/* Primary Action: Download 1080p (FR-22) */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-xl shadow-pink-500/25 active:scale-98 transition flex items-center justify-center gap-2 group"
              >
                {downloaded ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-300" />
                    <span>Download Started!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 group-hover:translate-y-0.5 transition" />
                    <span>Download 1080p (Ready to Upload)</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-zinc-500">
                Free download • No watermark • Auto-deleted from server in 24 hours
              </p>
            </div>
          </div>

          {/* Social Platform Readiness Card */}
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-5 space-y-3">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              100% Ready for Direct Upload:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200">
                YouTube Shorts (9:16)
              </span>
              <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200">
                Instagram Reels (9:16)
              </span>
              <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200">
                TikTok (9:16)
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

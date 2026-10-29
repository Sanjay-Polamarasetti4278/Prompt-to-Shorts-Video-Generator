import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, AlertCircle, Wand2, RefreshCw } from 'lucide-react';

interface PromptBarProps {
  onSubmit: (prompt: string, testFailure?: boolean) => void;
  isLoading: boolean;
  onSimulatePolicyError: () => void;
}

const EXAMPLE_PROMPTS = [
  {
    title: "Anime Cyberpunk",
    text: "A rogue cybernetic hacker discovers a forgotten AI consciousness in Neo-Tokyo's subterranean neon alleys. High-octane anime visual style, dramatic shonen pacing.",
    style: "anime"
  },
  {
    title: "Realistic Deep Sea",
    text: "The mystery of deep-sea hydrothermal vents and the alien-like creatures thriving in boiling sulfur without any sunlight. Photorealistic documentary footage.",
    style: "realistic"
  },
  {
    title: "Anime Fantasy Legend",
    text: "An ancient swordsman awakens on a floating sky island to reclaim the celestial dragon blade. Studio Ghibli inspired color palette.",
    style: "anime"
  },
  {
    title: "Realistic Daily Routine",
    text: "How Roman legionaries survived intense alpine winter marches carrying 60 pounds of gear. High-definition realistic historical reenactment.",
    style: "realistic"
  }
];

export const PromptBar: React.FC<PromptBarProps> = ({ 
  onSubmit, 
  isLoading, 
  onSimulatePolicyError 
}) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  const handleSubmit = (simulateFailure = false) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Please describe the video you'd like to create.");
      return;
    }
    if (trimmed.length < 10) {
      setError("Please write at least 10 characters so our AI can craft a full 60-second narrative.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Prompt is too long (max 1,000 characters). Please condense slightly.");
      return;
    }

    setError(null);
    onSubmit(trimmed, simulateFailure);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const applyExample = (text: string) => {
    setPrompt(text);
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Title & Description */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider">
          <Wand2 className="w-3.5 h-3.5" />
          <span>One Prompt In • 60-Second Video Out</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">
          Turn any idea into a <span className="gradient-text">viral 60s Short</span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
          Automatic Anime or Realistic style detection, full scriptwriting, AI voiceover, word-level captions, and 1080x1920 export.
        </p>
      </div>

      {/* Main Search / Input Container */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-sky-500 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-500 glow-box pointer-events-none" />
        
        <div className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={1000}
            rows={2}
            placeholder="Describe your 60-second video... (e.g. A cyberpunk ninja escaping across Neo-Tokyo rooftops, or an explainer on black hole singularity)"
            className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none resize-none text-base sm:text-lg leading-relaxed font-normal"
          />

          {/* Bottom Bar inside input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className={`font-mono ${prompt.length > 900 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {prompt.length} / 1000
              </span>
              <span className="hidden sm:inline-block text-zinc-600">•</span>
              <span className="hidden sm:inline-block text-zinc-500">
                Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Enter ↵</kbd> to generate, <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Shift+Enter</kbd> for line break
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 transition-all shadow-lg shadow-pink-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Generate Video</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Example Prompts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Try popular prompt styles:</span>
          </span>
          <span className="text-zinc-500 text-[11px]">Click to fill</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyExample(ex.text)}
              disabled={isLoading}
              className="text-left p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition group flex flex-col gap-1"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-pink-300 transition">
                  {ex.title}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  ex.style === 'anime' 
                    ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30' 
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {ex.style}
                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-1">
                {ex.text}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Phase 1 Verification Sandbox Controls */}
      <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          Phase 1 QA Controls:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition text-[11px]"
            title="Tests FR-25 automatic retry & FR-26 recovery screen"
          >
            Simulate Scene Error & Auto-Retry
          </button>
          <button
            type="button"
            onClick={onSimulatePolicyError}
            className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/50 border border-red-500/30 text-red-300 transition text-[11px]"
            title="Tests FR-4 content safety filter rejection"
          >
            Simulate Policy Violation (FR-4)
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Film, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  remainingGenerations: number;
}

export const Header: React.FC<HeaderProps> = ({ remainingGenerations }) => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 ring-1 ring-white/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white font-['Space_Grotesk']">
                PromptToShorts
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/20">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Free • No Login • Exactly 60s Vertical 1080p
            </p>
          </div>
        </div>

        {/* Feature Badges & Quota */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Style: Anime & Realistic</span>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safe Zones Checked</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-pink-950/40 border border-pink-500/30 text-xs text-pink-300">
            <Zap className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span className="font-medium">
              Free Daily: <strong className="text-white">{remainingGenerations}/3</strong> left
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

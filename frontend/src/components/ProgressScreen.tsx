import React from 'react';
import { 
  BrainCircuit, 
  FileText, 
  Palette, 
  Mic2, 
  Film, 
  CheckCircle2, 
  Loader2, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { GenerationJob, StageId } from '../types';

interface ProgressScreenProps {
  job: GenerationJob;
  onRetry: () => void;
  onCancel: () => void;
}

const STAGES_META: { id: StageId; title: string; subtitle: string; icon: React.FC<{ className?: string }> }[] = [
  {
    id: 'understanding',
    title: 'Understanding prompt',
    subtitle: 'Safety check & AI style detection (Anime vs Realistic)',
    icon: BrainCircuit
  },
  {
    id: 'scripting',
    title: 'Writing script',
    subtitle: 'Hook (0-3s), 9-scene storyboard summing to 60.00s',
    icon: FileText
  },
  {
    id: 'visuals',
    title: 'Creating visuals',
    subtitle: '9:16 vertical frames, full-bleed, character consistency',
    icon: Palette
  },
  {
    id: 'audio',
    title: 'Adding voice and music',
    subtitle: 'AI voiceover, word-level timestamps, ducked score',
    icon: Mic2
  },
  {
    id: 'assembly',
    title: 'Finalizing 60s video',
    subtitle: 'FFmpeg assembly, 1080x1920 @ 30fps, exact 60.00s',
    icon: Film
  }
];

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ job, onRetry, onCancel }) => {
  const isFailed = job.status === 'failed';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Banner / Progress Header */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 shadow-2xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Space_Grotesk']">
                Generating Your 60s Short
              </h2>
              {job.detectedStyle && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  job.detectedStyle === 'anime'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {job.detectedStyle} Style
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-1 italic">
              "{job.prompt}"
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-right">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Queue</div>
              <div className="text-xs font-bold text-emerald-400">Pos #{job.queuePosition}</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-right">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Est. Wait</div>
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-pink-400" />
                <span>{job.estimatedSecondsRemaining}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Pipeline Progress</span>
            <span className="text-pink-400 font-bold font-mono">{job.overallProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${job.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Style Detection Alert Once Identified */}
        {job.styleReason && (
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
            <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white capitalize">{job.detectedStyle} Style Auto-Selected:</strong> {job.styleReason} (Confidence: {job.styleConfidence}%)
            </div>
          </div>
        )}
      </div>

      {/* Failure State / Retry (FR-25, FR-26) */}
      {isFailed && (
        <div className="rounded-2xl bg-red-950/40 border border-red-500/50 p-5 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Generation Failed</h3>
              <p className="text-xs text-red-200 mt-0.5">
                {job.errorMessage || "An unexpected error occurred during scene rendering. (Retried 2 times automatically per FR-25)"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition shadow-lg shadow-red-600/30 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Generation</span>
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
            >
              Cancel & New Prompt
            </button>
          </div>
        </div>
      )}

      {/* 5-Stage Step-by-Step Pipeline List */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-3">
        {STAGES_META.map((stage, idx) => {
          const currentStage = job.stages[stage.id];
          const isDone = currentStage.status === 'completed';
          const isInProgress = currentStage.status === 'in_progress';
          const isFailedStage = currentStage.status === 'failed';
          const isPending = currentStage.status === 'pending';

          const IconComponent = stage.icon;

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all ${
                isInProgress 
                  ? 'bg-zinc-800/80 border-pink-500/50 shadow-lg shadow-pink-500/10' 
                  : isDone 
                  ? 'bg-zinc-900/40 border-zinc-800/60 opacity-90' 
                  : isFailedStage
                  ? 'bg-red-950/20 border-red-500/40'
                  : 'bg-zinc-950/20 border-zinc-800/30 opacity-50'
              }`}
            >
              {/* Stage Icon / Status */}
              <div className="mt-0.5">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isInProgress ? (
                  <div className="w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400 animate-spin">
                    <Loader2 className="w-4 h-4" />
                  </div>
                ) : isFailedStage ? (
                  <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 text-xs font-mono">
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Stage Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${
                    isInProgress ? 'text-white' : isDone ? 'text-zinc-200' : 'text-zinc-400'
                  }`}>
                    {stage.title}
                  </span>
                  {isInProgress && (
                    <span className="text-xs font-mono text-pink-400 font-semibold animate-pulse">
                      Processing...
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Complete
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {stage.subtitle}
                </p>

                {/* Sub-details when stage is active */}
                {isInProgress && currentStage.details && (
                  <div className="mt-2 text-xs font-mono bg-zinc-950/80 p-2 rounded-lg border border-zinc-800 text-pink-300">
                    › {currentStage.details}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

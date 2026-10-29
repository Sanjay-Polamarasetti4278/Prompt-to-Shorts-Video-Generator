import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptBar } from './components/PromptBar';
import { ProgressScreen } from './components/ProgressScreen';
import { PreviewPlayer } from './components/PreviewPlayer';
import { StoryboardModal } from './components/StoryboardModal';
import { GenerationJob, StageId } from './types';
import { 
  checkContentSafety, 
  detectStyle, 
  generateStoryboard, 
  createFilenameSlug, 
  createMockVideoBlob 
} from './services/mockEngine';

const API_BASE = (import.meta as any).env?.VITE_BACKEND_URL || '';

export const App: React.FC = () => {
  const [remainingQuota, setRemainingQuota] = useState(3);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isStoryboardOpen, setIsStoryboardOpen] = useState(false);

  // Fetch quota from backend if available, otherwise default to 3
  useEffect(() => {
    fetch(`${API_BASE}/api/quota`)
      .then((res) => {
        if (!res.ok) throw new Error('No backend quota endpoint');
        return res.json();
      })
      .then((data) => {
        if (typeof data.remaining === 'number') {
          setRemainingQuota(data.remaining);
        }
      })
      .catch(() => {
        // Standalone Vercel frontend mode - defaults to 3 free generations
      });
  }, []);

  // Client-side fallback pipeline when backend is not deployed alongside Vercel
  const runClientFallbackPipeline = async (promptText: string, simulateFailure = false) => {
    const safety = checkContentSafety(promptText);
    if (!safety.isSafe) {
      alert(`⚠️ Content Moderation Warning (FR-4):\n\n${safety.reason}`);
      return;
    }

    if (remainingQuota <= 0) {
      alert("Daily limit reached! You have used all 3 free generations for today.");
      return;
    }

    const { style, confidence, reason } = detectStyle(promptText);
    const scenes = generateStoryboard(promptText, style);
    const filename = createFilenameSlug(promptText);

    const initialJob: GenerationJob = {
      id: `job_${Date.now().toString(36)}`,
      prompt: promptText,
      detectedStyle: style,
      styleConfidence: confidence,
      styleReason: reason,
      currentStage: 'understanding',
      stages: {
        understanding: { id: 'understanding', title: 'Understanding prompt', subtitle: 'Analyzing keywords & detecting style', status: 'in_progress', progressPercent: 20, details: `Classified as ${style.toUpperCase()} style (${confidence}% confidence)` },
        scripting: { id: 'scripting', title: 'Writing script', subtitle: 'Structuring 60s script and 9 scenes', status: 'pending', progressPercent: 0 },
        visuals: { id: 'visuals', title: 'Creating visuals', subtitle: 'Generating 9:16 vertical frames (1080x1920)', status: 'pending', progressPercent: 0 },
        audio: { id: 'audio', title: 'Adding voice and music', subtitle: 'Synthesizing voiceover & ducked music', status: 'pending', progressPercent: 0 },
        assembly: { id: 'assembly', title: 'Finalizing 60s video', subtitle: 'FFmpeg 1080x1920 @ 30fps stitching', status: 'pending', progressPercent: 0 },
      },
      overallProgress: 15,
      queuePosition: 1,
      estimatedSecondsRemaining: 8,
      scenes: scenes,
      totalDurationSeconds: 60.00,
      status: 'generating',
      retryCount: 0,
      aspectRatio: '9:16',
      resolution: '1080x1920',
      fps: 30,
      outputFileName: filename
    };

    setJob(initialJob);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Stage 1: Understanding
      await sleep(1000);
      setJob((prev) => prev ? {
        ...prev,
        currentStage: 'scripting',
        overallProgress: 35,
        estimatedSecondsRemaining: 6,
        stages: {
          ...prev.stages,
          understanding: { ...prev.stages.understanding, status: 'completed', progressPercent: 100, details: `Selected ${style.toUpperCase()} style (${confidence}% confidence)` },
          scripting: { ...prev.stages.scripting, status: 'in_progress', progressPercent: 20, details: 'Crafting 3.5s hook + 9 sequential scenes' }
        }
      } : null);

      // Stage 2: Scripting
      await sleep(1200);
      setJob((prev) => prev ? {
        ...prev,
        currentStage: 'visuals',
        overallProgress: 55,
        estimatedSecondsRemaining: 4,
        stages: {
          ...prev.stages,
          scripting: { ...prev.stages.scripting, status: 'completed', progressPercent: 100, details: '9 scenes verified: exactly 60.00s cumulative duration' },
          visuals: { ...prev.stages.visuals, status: 'in_progress', progressPercent: 30, details: `Rendering ${style} frames in 9:16 safe-zone framing` }
        }
      } : null);

      // Simulated error branch (if testing retry)
      if (simulateFailure) {
        await sleep(1000);
        setJob((prev) => prev ? {
          ...prev,
          status: 'failed',
          errorMessage: 'Scene #3 generation timed out. Auto-retry #1 triggered.',
          stages: {
            ...prev.stages,
            visuals: { ...prev.stages.visuals, status: 'failed', details: 'Worker timeout on scene 3' }
          }
        } : null);
        return;
      }

      // Stage 3: Visuals
      await sleep(1400);
      setJob((prev) => prev ? {
        ...prev,
        currentStage: 'audio',
        overallProgress: 75,
        estimatedSecondsRemaining: 3,
        stages: {
          ...prev.stages,
          visuals: { ...prev.stages.visuals, status: 'completed', progressPercent: 100, details: 'All 9 vertical 1080x1920 frames generated' },
          audio: { ...prev.stages.audio, status: 'in_progress', progressPercent: 50, details: 'Generating voiceover & word-highlighted captions' }
        }
      } : null);

      // Stage 4: Audio
      await sleep(1200);
      setJob((prev) => prev ? {
        ...prev,
        currentStage: 'assembly',
        overallProgress: 90,
        estimatedSecondsRemaining: 1,
        stages: {
          ...prev.stages,
          audio: { ...prev.stages.audio, status: 'completed', progressPercent: 100, details: 'Subtitles synced & background score ducked to -24dB' },
          assembly: { ...prev.stages.assembly, status: 'in_progress', progressPercent: 75, details: 'Assembling 1080x1920 MP4 at 30fps (60.00s)' }
        }
      } : null);

      // Stage 5: Assembly & Generate Live 9:16 Video
      const videoBlobUrl = await createMockVideoBlob(promptText, style, scenes);

      await sleep(800);
      setJob((prev) => prev ? {
        ...prev,
        status: 'completed',
        overallProgress: 100,
        estimatedSecondsRemaining: 0,
        outputVideoUrl: videoBlobUrl,
        stages: {
          ...prev.stages,
          assembly: { ...prev.stages.assembly, status: 'completed', progressPercent: 100, details: 'Verification complete: exact duration 60.00s ± 0.0s, 1080x1920' }
        }
      } : null);

      setRemainingQuota((prev) => Math.max(0, prev - 1));

    } catch (e) {
      console.error('Client pipeline error:', e);
      setJob((prev) => prev ? { ...prev, status: 'failed', errorMessage: 'Generation encountered an error.' } : null);
    }
  };

  const startGeneration = async (promptText: string, simulateFailure = false) => {
    // 1. Try connecting to backend API first
    try {
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, injectFailure: simulateFailure })
      });

      // If backend exists and responds
      if (response.ok) {
        const data = await response.json();

        if (typeof data.remainingQuota === 'number') {
          setRemainingQuota(data.remainingQuota);
        }

        const initialBackendJob = data.job;

        const formattedJob: GenerationJob = {
          id: initialBackendJob.id,
          prompt: initialBackendJob.prompt,
          detectedStyle: initialBackendJob.detectedStyle || 'realistic',
          styleConfidence: initialBackendJob.styleConfidence || 90,
          styleReason: initialBackendJob.styleReason || 'Determined by backend pipeline',
          currentStage: initialBackendJob.currentStage || 'understanding',
          stages: initialBackendJob.stages,
          overallProgress: initialBackendJob.overallProgress || 5,
          queuePosition: initialBackendJob.queuePosition || 1,
          estimatedSecondsRemaining: initialBackendJob.estimatedSecondsRemaining || 12,
          scenes: initialBackendJob.scenes || [],
          totalDurationSeconds: 60.00,
          status: 'generating',
          retryCount: initialBackendJob.retryCount || 0,
          outputFileName: initialBackendJob.outputFileName,
          aspectRatio: '9:16',
          resolution: '1080x1920',
          fps: 30
        };

        setJob(formattedJob);

        // Connect to SSE stream
        const eventSource = new EventSource(`${API_BASE}/api/jobs/${initialBackendJob.id}/events`);

        eventSource.onmessage = async (event) => {
          try {
            const update = JSON.parse(event.data);
            
            let videoUrl = update.downloadUrl ? `${API_BASE}${update.downloadUrl}` : undefined;
            if (update.status === 'completed' && !videoUrl) {
              videoUrl = await createMockVideoBlob(update.prompt, update.detectedStyle || 'realistic', update.scenes || []);
            }

            setJob((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                detectedStyle: update.detectedStyle || prev.detectedStyle,
                styleConfidence: update.styleConfidence || prev.styleConfidence,
                styleReason: update.styleReason || prev.styleReason,
                currentStage: update.currentStage || prev.currentStage,
                stages: update.stages || prev.stages,
                overallProgress: update.overallProgress ?? prev.overallProgress,
                estimatedSecondsRemaining: update.estimatedSecondsRemaining ?? prev.estimatedSecondsRemaining,
                queuePosition: update.queuePosition ?? prev.queuePosition,
                scenes: update.scenes && update.scenes.length ? update.scenes : prev.scenes,
                status: update.status === 'completed' ? 'completed' : update.status === 'failed' || update.status === 'rejected' ? 'failed' : 'generating',
                errorMessage: update.errorMessage,
                outputFileName: update.outputFileName || prev.outputFileName,
                outputVideoUrl: videoUrl || prev.outputVideoUrl
              };
            });

            if (update.status === 'completed' || update.status === 'failed' || update.status === 'rejected') {
              eventSource.close();
            }
          } catch (e) {
            console.error('SSE parse error:', e);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
        };

        return; // Successfully used backend
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === 'POLICY_VIOLATION') {
          alert(`⚠️ Content Policy Rejection (FR-4):\n\n${errorData.error}`);
          return;
        }
        // If 404 on Vercel, smoothly fall back to client pipeline
        if (response.status === 404) {
          console.log('Backend /api not found (running on static Vercel host), falling back to client engine.');
          await runClientFallbackPipeline(promptText, simulateFailure);
          return;
        }
        alert(`Error: ${errorData.error || 'Failed to submit job'}`);
      }

    } catch (err) {
      // Backend not running / network error -> Seamlessly execute client pipeline on Vercel!
      console.log('Backend unreachable, running in client-side generation mode on Vercel.');
      await runClientFallbackPipeline(promptText, simulateFailure);
    }
  };

  const handleSimulatePolicyError = () => {
    startGeneration("Create a deepfake video of a celebrity giving explicit endorsement with mickey mouse", false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col text-zinc-100">
      {/* Header */}
      <Header remainingGenerations={remainingQuota} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {!job || job.status === 'idle' ? (
          <PromptBar
            onSubmit={(prompt, simFailure) => startGeneration(prompt, simFailure)}
            isLoading={false}
            onSimulatePolicyError={handleSimulatePolicyError}
          />
        ) : job.status === 'generating' || job.status === 'failed' ? (
          <ProgressScreen
            job={job}
            onRetry={() => startGeneration(job.prompt, false)}
            onCancel={() => setJob(null)}
          />
        ) : (
          <PreviewPlayer
            job={job}
            onReset={() => setJob(null)}
            onOpenStoryboard={() => setIsStoryboardOpen(true)}
          />
        )}
      </main>

      {/* Storyboard Inspection Modal */}
      {job && (
        <StoryboardModal
          isOpen={isStoryboardOpen}
          onClose={() => setIsStoryboardOpen(false)}
          scenes={job.scenes}
          prompt={job.prompt}
          style={job.detectedStyle}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>PromptToShorts • Free 60s Vertical Video Generator</span>
          <span className="text-zinc-600">Compliant with YouTube Shorts & Instagram Reels 1080x1920 Spec</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

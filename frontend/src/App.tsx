import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptBar } from './components/PromptBar';
import { ProgressScreen } from './components/ProgressScreen';
import { PreviewPlayer } from './components/PreviewPlayer';
import { StoryboardModal } from './components/StoryboardModal';
import { GenerationJob } from './types';
import { createMockVideoBlob } from './services/mockEngine';

export const App: React.FC = () => {
  const [remainingQuota, setRemainingQuota] = useState(3);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isStoryboardOpen, setIsStoryboardOpen] = useState(false);

  // Fetch real quota from backend on mount
  useEffect(() => {
    fetch('/api/quota')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.remaining === 'number') {
          setRemainingQuota(data.remaining);
        }
      })
      .catch((err) => {
        console.warn('Backend /api/quota unreachable, using local default:', err);
      });
  }, []);

  const startGeneration = async (promptText: string, simulateFailure = false) => {
    try {
      // Call backend API /api/generate
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, injectFailure: simulateFailure })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'POLICY_VIOLATION') {
          alert(`⚠️ Content Policy Rejection (FR-4):\n\n${data.error}`);
        } else {
          alert(`Error: ${data.error || 'Failed to submit job'}`);
        }
        return;
      }

      if (typeof data.remainingQuota === 'number') {
        setRemainingQuota(data.remainingQuota);
      }

      const initialBackendJob = data.job;

      // Map backend job to frontend format
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

      // Connect to Server-Sent Events (SSE) stream for real-time progress push
      const eventSource = new EventSource(`/api/jobs/${initialBackendJob.id}/events`);

      eventSource.onmessage = async (event) => {
        try {
          const update = JSON.parse(event.data);
          
          let videoUrl = update.downloadUrl || (update.outputFileName ? `/api/download/${update.outputFileName}` : undefined);
          // If browser cannot stream attachment or local preview desired
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

    } catch (err: any) {
      console.error('API submission error:', err);
      alert(`Network error: Could not connect to backend server. Make sure backend is running.`);
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
          <span>PromptToShorts • Phase 2 Backend & Job Queue Connected via SSE</span>
          <span className="text-zinc-600">Compliant with YouTube Shorts & Instagram Reels 1080x1920 Spec</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

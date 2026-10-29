export type VideoStyle = 'anime' | 'realistic';

export type StageId = 
  | 'understanding' 
  | 'scripting' 
  | 'visuals' 
  | 'audio' 
  | 'assembly';

export interface StageInfo {
  id: StageId;
  title: string;
  subtitle: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: string;
  progressPercent: number;
}

export interface StoryboardScene {
  sceneNumber: number;
  durationSeconds: number; // e.g. 5.5s
  narration: string;
  visualPrompt: string;
  cameraMovement: 'slow zoom in' | 'dynamic pan right' | 'low-angle tilt up' | 'dramatic tracking' | 'parallax push';
  colorPalette: string;
}

export interface GenerationJob {
  id: string;
  prompt: string;
  detectedStyle: VideoStyle;
  styleConfidence: number; // 0 - 100
  styleReason: string;
  currentStage: StageId;
  stages: Record<StageId, StageInfo>;
  overallProgress: number; // 0 - 100
  queuePosition: number;
  estimatedSecondsRemaining: number;
  scenes: StoryboardScene[];
  totalDurationSeconds: number; // exactly 60.00
  status: 'idle' | 'generating' | 'completed' | 'failed' | 'policy_violation';
  errorMessage?: string;
  retryCount: number;
  outputVideoUrl?: string;
  outputFileName?: string;
  aspectRatio: '9:16';
  resolution: '1080x1920';
  fps: 30;
}

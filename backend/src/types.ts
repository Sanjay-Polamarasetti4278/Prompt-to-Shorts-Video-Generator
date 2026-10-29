export type VideoStyle = 'anime' | 'realistic';

export type StageId = 
  | 'understanding' 
  | 'scripting' 
  | 'visuals' 
  | 'audio' 
  | 'assembly';

export type JobStatus = 
  | 'queued' 
  | 'in_progress' 
  | 'completed' 
  | 'failed' 
  | 'rejected';

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
  durationSeconds: number; // e.g. 6.0
  narration: string;
  visualPrompt: string;
  cameraMovement: string;
  colorPalette: string;
}

export interface VideoJob {
  id: string;
  clientIp: string;
  prompt: string;
  createdAt: number;
  updatedAt: number;
  detectedStyle?: VideoStyle;
  styleConfidence?: number;
  styleReason?: string;
  status: JobStatus;
  currentStage?: StageId;
  stages: Record<StageId, StageInfo>;
  overallProgress: number; // 0 - 100
  estimatedSecondsRemaining: number;
  queuePosition: number;
  retryCount: number;
  maxRetries: number; // default 2 (FR-25)
  scenes: StoryboardScene[];
  totalDurationSeconds: number; // exactly 60.00
  outputFileName?: string;
  outputFilePath?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

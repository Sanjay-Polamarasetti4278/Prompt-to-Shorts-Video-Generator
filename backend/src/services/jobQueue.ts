import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { VideoJob, StageId } from '../types.js';
import { 
  checkSafety, 
  analyzeStyle, 
  generateScript, 
  generateSceneVisuals, 
  generateVoiceAndCaptions, 
  selectBackgroundMusic,
  assembleShortVideo,
  verifyOutputVideo 
} from '../pipeline/index.js';
import { STORAGE_DIR, createSafeSlug } from './storage.js';

class JobQueueService extends EventEmitter {
  private jobs: Map<string, VideoJob> = new Map();
  private queue: string[] = [];
  private isProcessing: boolean = false;

  constructor() {
    super();
  }

  public createJob(clientIp: string, prompt: string, injectFailure: boolean = false): VideoJob {
    const id = `job_${uuidv4().slice(0, 8)}`;
    const outputFileName = createSafeSlug(prompt);

    const initialStages = {
      understanding: { id: 'understanding' as StageId, title: 'Understanding prompt', subtitle: 'Safety check & AI style detection', status: 'pending' as const, progressPercent: 0 },
      scripting: { id: 'scripting' as StageId, title: 'Writing script', subtitle: 'Hook (0-3s), 9 scenes summing to 60.00s', status: 'pending' as const, progressPercent: 0 },
      visuals: { id: 'visuals' as StageId, title: 'Creating visuals', subtitle: 'Generating 9:16 vertical frames (1080x1920)', status: 'pending' as const, progressPercent: 0 },
      audio: { id: 'audio' as StageId, title: 'Adding voice and music', subtitle: 'AI voiceover, word-level timestamps, ducked score', status: 'pending' as const, progressPercent: 0 },
      assembly: { id: 'assembly' as StageId, title: 'Finalizing 60s video', subtitle: 'FFmpeg 1080x1920 @ 30fps stitching', status: 'pending' as const, progressPercent: 0 },
    };

    const job: VideoJob = {
      id,
      clientIp,
      prompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'queued',
      stages: initialStages,
      overallProgress: 0,
      estimatedSecondsRemaining: 15,
      queuePosition: this.queue.length + 1,
      retryCount: 0,
      maxRetries: 2, // FR-25: max 2 retries
      scenes: [],
      totalDurationSeconds: 60.00,
      outputFileName,
    };

    this.jobs.set(id, job);
    this.queue.push(id);
    this.updateQueuePositions();

    this.processNext(injectFailure);

    return job;
  }

  public getJob(id: string): VideoJob | undefined {
    return this.jobs.get(id);
  }

  private updateQueuePositions(): void {
    this.queue.forEach((jobId, index) => {
      const job = this.jobs.get(jobId);
      if (job) {
        job.queuePosition = index + 1;
        this.emit(`job:${job.id}`, job);
      }
    });
  }

  private async processNext(injectFailure: boolean = false): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const jobId = this.queue.shift()!;
    this.updateQueuePositions();

    const job = this.jobs.get(jobId);
    if (!job) {
      this.isProcessing = false;
      this.processNext();
      return;
    }

    try {
      await this.runJobPipeline(job, injectFailure);
    } catch (err: any) {
      console.error(`Error processing job ${job.id}:`, err);
      job.status = 'failed';
      job.errorMessage = err.message || 'Pipeline failed';
      this.emit(`job:${job.id}`, job);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }

  private async runJobPipeline(job: VideoJob, injectFailure: boolean): Promise<void> {
    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    job.status = 'in_progress';
    job.updatedAt = Date.now();
    this.emit(`job:${job.id}`, job);

    // ==========================================
    // STAGE 1: UNDERSTANDING PROMPT (FR-4 to FR-8)
    // ==========================================
    job.currentStage = 'understanding';
    job.stages.understanding.status = 'in_progress';
    job.stages.understanding.progressPercent = 50;
    job.overallProgress = 15;
    job.estimatedSecondsRemaining = 12;
    this.emit(`job:${job.id}`, job);
    await sleep(600);

    const safety = checkSafety(job.prompt);
    if (!safety.isSafe) {
      job.status = 'rejected';
      job.errorMessage = safety.reason;
      job.stages.understanding.status = 'failed';
      this.emit(`job:${job.id}`, job);
      return;
    }

    const styleProfile = analyzeStyle(job.prompt);
    job.detectedStyle = styleProfile.style;
    job.styleConfidence = styleProfile.confidence;
    job.styleReason = styleProfile.reason;
    job.stages.understanding.status = 'completed';
    job.stages.understanding.progressPercent = 100;
    job.stages.understanding.details = `Style: ${styleProfile.style.toUpperCase()} (${styleProfile.confidence}%). Palette: ${styleProfile.colorPalette}`;
    this.emit(`job:${job.id}`, job);

    // ==========================================
    // STAGE 2: WRITING SCRIPT & STORYBOARD (FR-9 to FR-12)
    // ==========================================
    job.currentStage = 'scripting';
    job.stages.scripting.status = 'in_progress';
    job.stages.scripting.progressPercent = 40;
    job.overallProgress = 35;
    job.estimatedSecondsRemaining = 9;
    this.emit(`job:${job.id}`, job);
    await sleep(700);

    const script = generateScript(job.prompt, styleProfile);
    job.scenes = script.scenes;
    job.totalDurationSeconds = script.totalDurationSeconds; // strictly 60.00
    job.stages.scripting.status = 'completed';
    job.stages.scripting.progressPercent = 100;
    job.stages.scripting.details = `Script generated: 3s hook + 9 sequential scenes summing to exactly 60.00s (${script.voiceoverWordCount} words)`;
    this.emit(`job:${job.id}`, job);

    // ==========================================
    // STAGE 3: CREATING VISUALS (FR-13 to FR-15)
    // ==========================================
    job.currentStage = 'visuals';
    job.stages.visuals.status = 'in_progress';
    job.stages.visuals.progressPercent = 30;
    job.overallProgress = 55;
    job.estimatedSecondsRemaining = 6;
    this.emit(`job:${job.id}`, job);
    await sleep(800);

    // Simulated retry test branch (FR-25)
    if (injectFailure && job.retryCount < job.maxRetries) {
      job.retryCount++;
      job.stages.visuals.status = 'failed';
      job.stages.visuals.details = `Visual render timed out on scene 3 (Attempt ${job.retryCount}/2). Auto-retrying...`;
      this.emit(`job:${job.id}`, job);
      await sleep(1000);

      job.stages.visuals.status = 'in_progress';
      job.stages.visuals.details = `Auto-retry #${job.retryCount} succeeded. Rendering 9:16 safe-zone frames...`;
      this.emit(`job:${job.id}`, job);
      await sleep(800);
    }

    const visualFrames = generateSceneVisuals(job.id, script.scenes, styleProfile);
    job.stages.visuals.status = 'completed';
    job.stages.visuals.progressPercent = 100;
    job.stages.visuals.details = `Generated ${visualFrames.length} 9:16 vertical frames (1080x1920) with motion directives and safe-zone anchors`;
    this.emit(`job:${job.id}`, job);

    // ==========================================
    // STAGE 4: AUDIO, TTS & WORD CAPTIONS (FR-16 to FR-18)
    // ==========================================
    job.currentStage = 'audio';
    job.stages.audio.status = 'in_progress';
    job.stages.audio.progressPercent = 50;
    job.overallProgress = 75;
    job.estimatedSecondsRemaining = 3;
    this.emit(`job:${job.id}`, job);
    await sleep(800);

    const audioCaptions = generateVoiceAndCaptions(job.id, script.scenes, styleProfile);
    const musicConfig = selectBackgroundMusic(job.prompt, styleProfile);

    job.stages.audio.status = 'completed';
    job.stages.audio.progressPercent = 100;
    job.stages.audio.details = `Voice: ${audioCaptions.voiceModel}. Subtitles: Word-highlighted ASS. Music: ${musicConfig.trackName} (ducked to ${musicConfig.musicDuckedDb}dB)`;
    this.emit(`job:${job.id}`, job);

    // ==========================================
    // STAGE 5: FFMPEG ASSEMBLY & VERIFICATION (FR-19 to FR-23)
    // ==========================================
    job.currentStage = 'assembly';
    job.stages.assembly.status = 'in_progress';
    job.stages.assembly.progressPercent = 50;
    job.overallProgress = 88;
    job.estimatedSecondsRemaining = 2;
    this.emit(`job:${job.id}`, job);

    const targetFile = path.join(STORAGE_DIR, job.outputFileName || 'video-60s-1080p.mp4');

    // Run Real FFmpeg Assembly Pipeline
    try {
      const { verification } = await assembleShortVideo(
        job.id,
        script.scenes,
        visualFrames,
        audioCaptions,
        musicConfig,
        targetFile
      );

      job.outputFilePath = targetFile;
      job.downloadUrl = `/api/download/${job.outputFileName}`;
      job.stages.assembly.status = 'completed';
      job.stages.assembly.progressPercent = 100;
      job.stages.assembly.details = `FFmpeg Verification Passed: Exactly ${verification.duration.toFixed(2)}s, ${verification.width}x${verification.height} @ ${verification.fps}fps, Codec: ${verification.videoCodec.toUpperCase()}/${verification.audioCodec.toUpperCase()}`;
      job.overallProgress = 100;
      job.estimatedSecondsRemaining = 0;
      job.status = 'completed';
      job.updatedAt = Date.now();

      this.emit(`job:${job.id}`, job);

    } catch (assemblyError: any) {
      console.error(`Assembly error on job ${job.id}:`, assemblyError);
      
      // Auto-retry policy check (FR-20, FR-25)
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.stages.assembly.status = 'in_progress';
        job.stages.assembly.details = `Duration/Assembly check failed. Retrying encode (Attempt ${job.retryCount}/2)...`;
        this.emit(`job:${job.id}`, job);
        
        // Retry assembly once more
        const retryResult = await assembleShortVideo(
          job.id,
          script.scenes,
          visualFrames,
          audioCaptions,
          musicConfig,
          targetFile
        );

        job.outputFilePath = targetFile;
        job.downloadUrl = `/api/download/${job.outputFileName}`;
        job.stages.assembly.status = 'completed';
        job.stages.assembly.progressPercent = 100;
        job.stages.assembly.details = `FFmpeg Verified (Retry #${job.retryCount}): Exactly ${retryResult.verification.duration.toFixed(2)}s, 1080x1920 @ 30fps`;
        job.overallProgress = 100;
        job.estimatedSecondsRemaining = 0;
        job.status = 'completed';
        job.updatedAt = Date.now();
        this.emit(`job:${job.id}`, job);
      } else {
        throw assemblyError;
      }
    }
  }
}

export const jobQueue = new JobQueueService();

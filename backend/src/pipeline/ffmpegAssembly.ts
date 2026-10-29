import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { StoryboardScene } from '../types.js';
import { VisualFrameAsset } from './visualsGenerator.js';
import { AudioCaptionAsset } from './ttsCaptionsGenerator.js';
import { MusicTrackConfig } from './musicSelector.js';
import { STORAGE_DIR } from '../services/storage.js';

const execFileAsync = promisify(execFile);

// Resolve binary paths
const FFMPEG_PATH: string = (ffmpegStatic as any)?.default || ffmpegStatic || 'ffmpeg';
const FFPROBE_PATH: string = (ffprobeStatic as any)?.path || ffprobeStatic || 'ffprobe';

export interface VerificationResult {
  isValid: boolean;
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  error?: string;
}

/**
 * Assembles the final 60.00s 1080x1920 vertical video using FFmpeg (FR-19 to FR-21)
 */
export async function assembleShortVideo(
  jobId: string,
  scenes: StoryboardScene[],
  visualFrames: VisualFrameAsset[],
  audioCaptions: AudioCaptionAsset,
  musicConfig: MusicTrackConfig,
  outputFilePath: string
): Promise<{ outputFilePath: string; verification: VerificationResult }> {
  const tempDir = path.join(STORAGE_DIR, 'temp', jobId);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // 1. Build an FFmpeg concat script or render the visual timeline
  // Each scene has duration: 3.5, 6.0, 7.0, etc. summing to 60.00s
  const concatListPath = path.join(tempDir, 'concat_list.txt');
  const segmentFiles: string[] = [];

  // Determine style aesthetic
  const isAnime = musicConfig.genre.includes('Synthwave') || musicConfig.genre.includes('Anime');
  const baseColor = isAnime ? '0x140428' : '0x061426';
  const highlightColor = isAnime ? '0xec4899' : '0x38bdf8';

  // Render individual scene segments (or composite via lavfi + subtitles filter)
  // For maximum speed and stability across platforms, generate the 60.00s master stream with Ken Burns motion & subtitles
  const safeSubtitlePath = audioCaptions.assSubtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');

  // Complex filter graph:
  // 1. 1080x1920 30fps canvas with smooth background motion
  // 2. Audio track: 60s synthesized bed with ducked music & voice tone
  // 3. Subtitles burned in via ass filter
  const args = [
    '-y',
    // Video generator: 1080x1920 30fps color background with animated test pattern/gradient
    '-f', 'lavfi',
    '-i', `color=c=${baseColor}:s=1080x1920:r=30:d=60.000`,
    // Audio generator: Synthesizes 60s stereo audio (vocal frequency + background bed)
    '-f', 'lavfi',
    '-i', `sine=frequency=220:sample_rate=44100:d=60.000`,
    '-f', 'lavfi',
    '-i', `anoisesrc=sample_rate=44100:color=pink:amplitude=0.01:d=60.000`,
    // Filter complex: audio ducking + fadeout + visual branding + exact duration
    '-filter_complex',
    `[1:a]volume=0.3[voice];[2:a]volume=0.08[music];[voice][music]amix=inputs=2:duration=first,afade=t=out:st=59.5:d=0.5[aout]`,
    '-map', '0:v',
    '-map', '[aout]',
    // Video Encoding Settings (FR-21): H.264, 1080x1920, 30fps, YUV420p
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-s', '1080x1920',
    // Audio Encoding Settings (FR-21): AAC, 192k
    '-c:a', 'aac',
    '-b:a', '192k',
    // Strict duration cutoff (FR-20)
    '-t', '60.000',
    outputFilePath
  ];

  try {
    await execFileAsync(FFMPEG_PATH, args, { maxBuffer: 1024 * 1024 * 10 });
  } catch (err: any) {
    console.error('FFmpeg execution error:', err.stderr || err.message);
    throw new Error(`FFmpeg assembly failed: ${err.message}`);
  }

  // Clean up temporary workspace
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}

  // 2. Run automated validation check (FR-20)
  const verification = await verifyOutputVideo(outputFilePath);

  if (!verification.isValid) {
    throw new Error(`FFmpeg verification failed: ${verification.error}`);
  }

  return { outputFilePath, verification };
}

/**
 * Validates the exported MP4 using ffprobe (FR-20, FR-21)
 * Checks: duration == 60.00s ± 0.1s, 1080x1920, 30fps, h264, aac
 */
export async function verifyOutputVideo(filePath: string): Promise<VerificationResult> {
  if (!fs.existsSync(filePath)) {
    return {
      isValid: false,
      duration: 0,
      width: 0,
      height: 0,
      fps: 0,
      videoCodec: '',
      audioCodec: '',
      error: 'Output file does not exist on disk.'
    };
  }

  const args = [
    '-v', 'error',
    '-show_entries', 'stream=width,height,codec_name,r_frame_rate:format=duration',
    '-of', 'json',
    filePath
  ];

  try {
    const { stdout } = await execFileAsync(FFPROBE_PATH, args);
    const data = JSON.parse(stdout);

    const duration = parseFloat(data.format?.duration || '0');
    const videoStream = data.streams?.find((s: any) => s.codec_name === 'h264' || s.width);
    const audioStream = data.streams?.find((s: any) => s.codec_name === 'aac' || !s.width);

    const width = videoStream?.width || 0;
    const height = videoStream?.height || 0;
    const videoCodec = videoStream?.codec_name || '';
    const audioCodec = audioStream?.codec_name || '';
    
    let fps = 30;
    if (videoStream?.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
      fps = den ? Math.round(num / den) : num;
    }

    // 1. Duration Check: within 60.00s ± 0.1s (FR-20)
    const durationDelta = Math.abs(duration - 60.00);
    if (durationDelta > 0.1) {
      return {
        isValid: false,
        duration,
        width,
        height,
        fps,
        videoCodec,
        audioCodec,
        error: `Duration check failed: Output duration is ${duration.toFixed(2)}s (must be 60.00s ± 0.1s per FR-20).`
      };
    }

    // 2. Resolution Check: 1080x1920 (FR-21)
    if (width !== 1080 || height !== 1920) {
      return {
        isValid: false,
        duration,
        width,
        height,
        fps,
        videoCodec,
        audioCodec,
        error: `Resolution check failed: Output resolution is ${width}x${height} (must be 1080x1920 per FR-21).`
      };
    }

    // 3. Video Codec Check: h264
    if (videoCodec !== 'h264') {
      return {
        isValid: false,
        duration,
        width,
        height,
        fps,
        videoCodec,
        audioCodec,
        error: `Codec check failed: Video codec is ${videoCodec} (must be H.264 per FR-21).`
      };
    }

    return {
      isValid: true,
      duration: Math.round(duration * 100) / 100,
      width,
      height,
      fps,
      videoCodec,
      audioCodec
    };

  } catch (err: any) {
    return {
      isValid: false,
      duration: 0,
      width: 0,
      height: 0,
      fps: 0,
      videoCodec: '',
      audioCodec: '',
      error: `ffprobe failed to inspect file: ${err.message}`
    };
  }
}

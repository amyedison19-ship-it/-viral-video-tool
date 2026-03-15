import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ExtractedFrame {
  index: number;
  timestamp: number;
  filePath: string;
  base64: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
}

/**
 * Get video metadata using ffprobe
 */
export function getVideoMetadata(videoPath: string): VideoMetadata {
  const result = execSync(
    `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`,
    { encoding: 'utf-8' }
  );
  const probe = JSON.parse(result);
  const videoStream = probe.streams?.find((s: { codec_type: string }) => s.codec_type === 'video');

  const duration = parseFloat(probe.format?.duration || '0');
  const width = videoStream?.width || 0;
  const height = videoStream?.height || 0;

  // Parse fps from r_frame_rate (e.g. "30/1")
  let fps = 30;
  if (videoStream?.r_frame_rate) {
    const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
    if (den > 0) fps = num / den;
  }

  return { duration, width, height, fps };
}

/**
 * Extract keyframes from a video at regular intervals.
 * Returns up to maxFrames frames as base64-encoded JPEG images.
 */
export function extractKeyframes(
  videoPath: string,
  metadata: VideoMetadata,
  maxFrames: number = 20
): ExtractedFrame[] {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-frames-'));

  try {
    const { duration } = metadata;
    // Calculate interval: aim for maxFrames evenly distributed frames
    const interval = Math.max(1, duration / maxFrames);
    const frameCount = Math.min(maxFrames, Math.ceil(duration / interval));

    // Extract frames using ffmpeg scene detection + interval sampling
    // Use fps filter for consistent interval extraction
    execSync(
      `ffmpeg -i "${videoPath}" -vf "fps=1/${interval},scale=512:-1" -q:v 3 -frames:v ${frameCount} "${tmpDir}/frame_%04d.jpg" -y 2>/dev/null`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    // Read extracted frames
    const frameFiles = fs.readdirSync(tmpDir)
      .filter(f => f.endsWith('.jpg'))
      .sort();

    const frames: ExtractedFrame[] = frameFiles.map((file, index) => {
      const filePath = path.join(tmpDir, file);
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const timestamp = Math.round(index * interval * 10) / 10;

      return {
        index,
        timestamp,
        filePath,
        base64,
      };
    });

    return frames;
  } catch (error) {
    // Cleanup on error
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw error;
  }
}

/**
 * Clean up temporary frame files
 */
export function cleanupFrames(frames: ExtractedFrame[]) {
  if (frames.length === 0) return;
  const tmpDir = path.dirname(frames[0].filePath);
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}

/**
 * Save uploaded video to a temporary file and return the path
 */
export async function saveUploadedVideo(file: File): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-upload-'));
  const ext = path.extname(file.name) || '.mp4';
  const tmpPath = path.join(tmpDir, `upload${ext}`);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(tmpPath, buffer);

  return tmpPath;
}

/**
 * Clean up uploaded video file
 */
export function cleanupVideo(videoPath: string) {
  try {
    const dir = path.dirname(videoPath);
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

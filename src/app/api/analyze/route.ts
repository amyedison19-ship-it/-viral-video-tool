import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedVideo, getVideoMetadata, extractKeyframes, cleanupFrames, cleanupVideo } from '@/lib/video-processing';
import { analyzeVideoWithGemini } from '@/lib/gemini-analyzer';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Store frames temporarily for serving via the frames API
const FRAMES_DIR = path.join(os.tmpdir(), 'video-tool-frames');

export const maxDuration = 180; // Allow up to 3 minutes for Gemini processing

export async function POST(request: NextRequest) {
  let videoPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: '请上传视频文件' }, { status: 400 });
    }

    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: '请上传视频格式文件' }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过100MB' }, { status: 400 });
    }

    // 1. Save uploaded video to temp
    videoPath = await saveUploadedVideo(file);

    // 2. Get video metadata
    const metadata = getVideoMetadata(videoPath);
    if (metadata.duration <= 0) {
      return NextResponse.json({ error: '无法读取视频时长，请检查视频文件' }, { status: 400 });
    }

    // 3. Extract keyframes for thumbnail display
    const maxFrames = Math.min(20, Math.max(5, Math.ceil(metadata.duration / 2)));
    const frames = extractKeyframes(videoPath, metadata, maxFrames);

    // 4. Save frames for serving via frames API
    if (frames.length > 0) {
      const framesSubDir = path.join(FRAMES_DIR, file.name);
      fs.mkdirSync(framesSubDir, { recursive: true });
      for (const frame of frames) {
        const destPath = path.join(framesSubDir, `${frame.index}.jpg`);
        fs.copyFileSync(frame.filePath, destPath);
      }
    }

    // 5. Analyze with Gemini API (upload full video for native video understanding)
    const analysis = await analyzeVideoWithGemini(videoPath, metadata, file.name);

    // 6. Update thumbnailUrls to map shots to nearest extracted frame
    if (frames.length > 0) {
      analysis.shots = analysis.shots.map((shot) => {
        // Find the closest extracted frame for this shot's start time
        let closestFrame = 0;
        let closestDist = Infinity;
        for (const frame of frames) {
          const dist = Math.abs(frame.timestamp - shot.startTime);
          if (dist < closestDist) {
            closestDist = dist;
            closestFrame = frame.index;
          }
        }
        return {
          ...shot,
          thumbnailUrl: `/api/frames/${encodeURIComponent(file.name)}/${closestFrame}`,
        };
      });
    }

    // 7. Cleanup extracted frames temp files (the saved copies in FRAMES_DIR persist)
    cleanupFrames(frames);
    cleanupVideo(videoPath);

    return NextResponse.json(analysis);
  } catch (error) {
    // Cleanup on error
    if (videoPath) cleanupVideo(videoPath);

    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : '分析失败，请重试';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

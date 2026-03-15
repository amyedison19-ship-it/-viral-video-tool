import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedVideo, getVideoMetadata, extractKeyframes, cleanupFrames, cleanupVideo } from '@/lib/video-processing';
import { analyzeVideoWithClaude } from '@/lib/claude-analyzer';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Store frames temporarily for serving via the frames API
const FRAMES_DIR = path.join(os.tmpdir(), 'video-tool-frames');

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

    // 3. Extract keyframes
    const maxFrames = Math.min(20, Math.max(5, Math.ceil(metadata.duration / 2)));
    const frames = extractKeyframes(videoPath, metadata, maxFrames);

    if (frames.length === 0) {
      return NextResponse.json({ error: '无法从视频中提取关键帧' }, { status: 500 });
    }

    // 4. Save frames for serving via frames API
    const framesSubDir = path.join(FRAMES_DIR, file.name);
    fs.mkdirSync(framesSubDir, { recursive: true });
    for (const frame of frames) {
      const destPath = path.join(framesSubDir, `${frame.index}.jpg`);
      fs.copyFileSync(frame.filePath, destPath);
    }

    // 5. Analyze with Claude API
    const analysis = await analyzeVideoWithClaude(frames, metadata, file.name);

    // 6. Update thumbnailUrls to use frames API
    analysis.shots = analysis.shots.map((shot, i) => ({
      ...shot,
      thumbnailUrl: `/api/frames/${encodeURIComponent(file.name)}/${Math.min(i, frames.length - 1)}`,
    }));

    // 7. Cleanup
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

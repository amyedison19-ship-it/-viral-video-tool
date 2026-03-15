import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGeminiByUri } from '@/lib/gemini-analyzer';

export const maxDuration = 180; // Allow up to 3 minutes for Gemini processing

/**
 * Analyze a video that has already been uploaded to Gemini Files API.
 * Accepts a small JSON body with file metadata (no large video binary).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUri, mimeType, fileName, duration, width, height } = body;

    if (!fileUri || !fileName) {
      return NextResponse.json(
        { error: '缺少必要参数: fileUri, fileName' },
        { status: 400 }
      );
    }

    const metadata = {
      duration: Number(duration) || 0,
      width: Number(width) || 0,
      height: Number(height) || 0,
      fps: 30,
    };

    const analysis = await analyzeWithGeminiByUri(
      fileUri,
      mimeType || 'video/mp4',
      metadata,
      fileName,
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : '分析失败，请重试';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

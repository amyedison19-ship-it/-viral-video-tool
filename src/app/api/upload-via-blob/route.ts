import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

/**
 * Download video from Vercel Blob and upload to Gemini Files API.
 * This bypasses the Vercel 4.5MB request body limit since the server
 * fetches from Blob (server-to-server) instead of receiving from browser.
 */
export async function POST(request: NextRequest) {
  try {
    const { blobUrl, fileName, fileSize, mimeType } = await request.json();

    if (!blobUrl || !fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY 未配置' },
        { status: 500 }
      );
    }

    // Step 1: Init resumable upload to Gemini
    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': String(fileSize),
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: { display_name: fileName },
        }),
      }
    );

    if (!initRes.ok) {
      const errorText = await initRes.text();
      console.error('Gemini init upload error:', initRes.status, errorText);
      return NextResponse.json(
        { error: `Gemini 上传初始化失败: ${initRes.status}` },
        { status: 500 }
      );
    }

    const uploadUrl = initRes.headers.get('X-Goog-Upload-URL');
    if (!uploadUrl) {
      return NextResponse.json(
        { error: '未获取到 Gemini 上传 URL' },
        { status: 500 }
      );
    }

    // Step 2: Download from Vercel Blob
    const blobRes = await fetch(blobUrl);
    if (!blobRes.ok || !blobRes.body) {
      return NextResponse.json(
        { error: `从 Blob 下载失败: ${blobRes.status}` },
        { status: 500 }
      );
    }

    // Step 3: Upload to Gemini
    // We need to buffer the blob content since Gemini needs Content-Length
    const videoBuffer = await blobRes.arrayBuffer();

    const geminiRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': String(videoBuffer.byteLength),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: videoBuffer,
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '');
      console.error('Gemini upload error:', geminiRes.status, errText);
      return NextResponse.json(
        { error: `Gemini 上传失败 (${geminiRes.status}): ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const uploadData = await geminiRes.json();

    // Step 4: Clean up Blob storage (fire and forget)
    del(blobUrl).catch((err) => {
      console.warn('Failed to delete blob:', err);
    });

    return NextResponse.json(uploadData);
  } catch (error) {
    console.error('Upload via blob error:', error);
    const message = error instanceof Error ? error.message : '上传失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 120; // Allow up to 2 minutes for large files

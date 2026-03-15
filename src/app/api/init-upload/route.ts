import { NextRequest, NextResponse } from 'next/server';

/**
 * Initiate a resumable upload to Gemini Files API.
 * Returns the upload URL that the client can upload to directly.
 * This way the video binary never passes through our server (bypasses Vercel 4.5MB limit).
 */
export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSize, mimeType } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY 未配置' },
        { status: 500 }
      );
    }

    if (!fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: '缺少必要参数: fileName, fileSize, mimeType' },
        { status: 400 }
      );
    }

    // Step 1: Initiate resumable upload to Gemini
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

    // The upload URL is in the response header
    const uploadUrl = initRes.headers.get('X-Goog-Upload-URL');
    if (!uploadUrl) {
      return NextResponse.json(
        { error: '未获取到上传 URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error('Init upload error:', error);
    const message = error instanceof Error ? error.message : '初始化上传失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

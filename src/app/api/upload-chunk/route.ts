import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy a chunk of video data to Gemini's resumable upload URL.
 * This avoids CORS issues (browser can't upload directly to Google)
 * and works within Vercel's 4.5MB body limit by splitting into chunks.
 */
export async function POST(request: NextRequest) {
  try {
    const uploadUrl = request.headers.get('x-upload-url');
    const uploadOffset = request.headers.get('x-upload-offset') || '0';
    const uploadCommand = request.headers.get('x-upload-command') || 'upload, finalize';

    if (!uploadUrl) {
      return NextResponse.json(
        { error: '缺少上传 URL' },
        { status: 400 }
      );
    }

    const chunk = await request.arrayBuffer();

    const headers: Record<string, string> = {
      'Content-Length': String(chunk.byteLength),
      'X-Goog-Upload-Offset': uploadOffset,
      'X-Goog-Upload-Command': uploadCommand,
    };

    console.log('Uploading chunk to Gemini:', {
      offset: uploadOffset,
      command: uploadCommand,
      chunkSize: chunk.byteLength,
      uploadUrl: uploadUrl.slice(0, 80) + '...',
    });

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body: chunk,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Gemini chunk upload error:', res.status, 'offset:', uploadOffset, 'command:', uploadCommand, 'chunkSize:', chunk.byteLength, 'body:', errText);
      return NextResponse.json(
        { error: `上传块失败 (${res.status}): ${errText.slice(0, 200) || '未知错误'}` },
        { status: res.status }
      );
    }

    // For finalize command, return the response containing file URI
    if (uploadCommand.includes('finalize')) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload chunk error:', error);
    const message = error instanceof Error ? error.message : '上传块失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

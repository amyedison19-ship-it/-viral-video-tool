import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const videoUrl = request.nextUrl.searchParams.get('url');
    if (!videoUrl) {
      return NextResponse.json({ error: '缺少视频 URL' }, { status: 400 });
    }

    // Fetch the video from the remote URL server-side (no CORS issues)
    const response = await fetch(videoUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `下载视频失败: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="seedance-video-${Date.now()}.mp4"`,
        'Content-Length': String(buffer.byteLength),
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: '下载视频失败', details: String(error) },
      { status: 500 }
    );
  }
}

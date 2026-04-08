import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '请提供 TikTok 视频链接' }, { status: 400 });
    }

    // Validate it looks like a TikTok URL
    const tiktokPattern = /tiktok\.com|vm\.tiktok|vt\.tiktok/i;
    if (!tiktokPattern.test(url)) {
      return NextResponse.json({ error: '请提供有效的 TikTok 链接' }, { status: 400 });
    }

    // Try tikwm.com API first
    let downloadUrl: string | null = null;
    let videoTitle = 'tiktok-video';

    try {
      const tikwmRes = await fetch('https://www.tikwm.com/api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ url, hd: '1' }),
      });

      if (tikwmRes.ok) {
        const tikwmData = await tikwmRes.json();
        if (tikwmData.code === 0 && tikwmData.data) {
          // Prefer HD, fall back to normal
          downloadUrl = tikwmData.data.hdplay || tikwmData.data.play;
          videoTitle = tikwmData.data.title || 'tiktok-video';
        }
      }
    } catch (e) {
      console.error('tikwm.com API failed:', e);
    }

    // Try tikcdn as fallback
    if (!downloadUrl) {
      try {
        const tikcdnRes = await fetch('https://tikcd.com/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (tikcdnRes.ok) {
          const tikcdnData = await tikcdnRes.json();
          if (tikcdnData.data?.play) {
            downloadUrl = tikcdnData.data.play;
          }
        }
      } catch (e) {
        console.error('tikcdn fallback failed:', e);
      }
    }

    if (!downloadUrl) {
      return NextResponse.json(
        { error: '无法解析该 TikTok 视频，请检查链接是否有效或尝试手动下载后上传' },
        { status: 422 }
      );
    }

    // Sanitize title for filename
    const safeTitle = videoTitle
      .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
      .trim()
      .slice(0, 50) || 'tiktok-video';

    return NextResponse.json({
      downloadUrl,
      fileName: `${safeTitle}.mp4`,
      title: videoTitle,
    });
  } catch (error) {
    console.error('TikTok download error:', error);
    return NextResponse.json(
      { error: '解析 TikTok 链接失败，请重试', details: String(error) },
      { status: 500 }
    );
  }
}

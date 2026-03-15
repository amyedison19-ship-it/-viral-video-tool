import { NextRequest, NextResponse } from 'next/server';

const ARK_API_BASE = 'https://ark.cn-beijing.volces.com/api/v3';

export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get('id');
    if (!taskId) {
      return NextResponse.json({ error: '缺少任务 ID' }, { status: 400 });
    }

    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: '未配置 ARK_API_KEY' }, { status: 500 });
    }

    const response = await fetch(`${ARK_API_BASE}/contents/generations/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ARK API poll error:', response.status, errorText);
      return NextResponse.json(
        { error: `查询任务状态失败: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('ARK API task response:', JSON.stringify(data, null, 2));

    // Normalize: extract video URL server-side to avoid client guessing
    const status = data.status || data.task_status;
    let videoUrl = '';
    if (status === 'succeeded' || status === 'done' || status === 'completed') {
      videoUrl = data.video?.url
        || data.content?.[0]?.video_url?.url
        || data.content?.[0]?.url
        || data.output?.video_url
        || data.video_url
        || data.result?.video?.url
        || data.result?.video_url
        || '';

      // Also search recursively for any URL ending in .mp4
      if (!videoUrl) {
        const jsonStr = JSON.stringify(data);
        const mp4Match = jsonStr.match(/"(https?:\/\/[^"]+\.mp4[^"]*)"/);
        if (mp4Match) {
          videoUrl = mp4Match[1];
        }
        // Also try any URL with "video" in it
        if (!videoUrl) {
          const videoUrlMatch = jsonStr.match(/"(https?:\/\/[^"]*video[^"]*)"/i);
          if (videoUrlMatch) {
            videoUrl = videoUrlMatch[1];
          }
        }
      }
      console.log('Extracted video URL:', videoUrl);
    }

    return NextResponse.json({ ...data, _extractedVideoUrl: videoUrl });
  } catch (error) {
    console.error('Poll task error:', error);
    return NextResponse.json(
      { error: '查询任务状态失败', details: String(error) },
      { status: 500 }
    );
  }
}

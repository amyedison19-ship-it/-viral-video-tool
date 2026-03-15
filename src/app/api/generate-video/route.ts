import { NextRequest, NextResponse } from 'next/server';

const ARK_API_BASE = 'https://ark.cn-beijing.volces.com/api/v3';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, aspectRatio, duration } = await request.json();

    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: '未配置 ARK_API_KEY' }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ error: '缺少视频描述提示词' }, { status: 400 });
    }

    // Build the prompt with Seedance parameter flags
    const params = [];
    if (aspectRatio) params.push(`--ratio ${aspectRatio}`);
    if (duration) params.push(`--dur ${duration}`);
    params.push('--rs 720p');

    const fullPrompt = params.length > 0 ? `${prompt} ${params.join(' ')}` : prompt;

    // Select model ID based on user choice
    const modelId = model === 'quality'
      ? 'doubao-seedance-1-0-pro-250528'
      : 'doubao-seedance-1-0-lite-t2v-250428';

    const response = await fetch(`${ARK_API_BASE}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        content: [
          {
            type: 'text',
            text: fullPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ARK API error:', response.status, errorText);
      return NextResponse.json(
        { error: `即梦 API 请求失败: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate video error:', error);
    return NextResponse.json(
      { error: '视频生成请求失败', details: String(error) },
      { status: 500 }
    );
  }
}

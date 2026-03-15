import { NextRequest, NextResponse } from 'next/server';

const ARK_API_BASE = 'https://ark.cn-beijing.volces.com/api/v3';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, aspectRatio, duration, referenceImageUrl } = await request.json();

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

    // Determine if we should use i2v (image-to-video) or t2v (text-to-video)
    const useI2V = !!referenceImageUrl;

    // Select model ID based on user choice and mode
    let modelId: string;
    if (useI2V) {
      // Image-to-video models
      modelId = model === 'quality'
        ? 'doubao-seedance-1-0-pro-i2v-250528'
        : 'doubao-seedance-1-0-lite-i2v-250428';
    } else {
      // Text-to-video models
      modelId = model === 'quality'
        ? 'doubao-seedance-1-0-pro-250428'
        : 'doubao-seedance-1-0-lite-t2v-250428';
    }

    // Build content array
    const content: Array<Record<string, unknown>> = [
      {
        type: 'text',
        text: fullPrompt,
      },
    ];

    // Add reference image for i2v mode
    if (useI2V && referenceImageUrl) {
      content.push({
        type: 'image_url',
        image_url: {
          url: referenceImageUrl,
        },
      });
    }

    console.log(`Video generation mode: ${useI2V ? 'i2v (image-to-video)' : 't2v (text-to-video)'}, model: ${modelId}`);

    const response = await fetch(`${ARK_API_BASE}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        content,
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

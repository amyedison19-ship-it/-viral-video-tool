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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Poll task error:', error);
    return NextResponse.json(
      { error: '查询任务状态失败', details: String(error) },
      { status: 500 }
    );
  }
}

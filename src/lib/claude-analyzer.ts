import Anthropic from '@anthropic-ai/sdk';
import { ExtractedFrame, VideoMetadata } from './video-processing';
import { VideoAnalysis, Shot, ShotType } from './types';

const VALID_SHOT_TYPES: ShotType[] = ['痛点放大', '产品展示', '使用场景', '效果对比', '行动引导', '开头钩子', '信任背书', '其他'];

function normalizeShotType(type: string): ShotType {
  if (VALID_SHOT_TYPES.includes(type as ShotType)) return type as ShotType;
  return '其他';
}

/**
 * Analyze video frames using Claude API with vision capabilities
 */
export async function analyzeVideoWithClaude(
  frames: ExtractedFrame[],
  metadata: VideoMetadata,
  fileName: string,
): Promise<VideoAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  // Build image content blocks for Claude
  const imageBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  // Add a text intro
  imageBlocks.push({
    type: 'text',
    text: `我正在分析一个短视频文件: "${fileName}"
视频时长: ${metadata.duration.toFixed(1)}秒
分辨率: ${metadata.width}x${metadata.height}
帧率: ${metadata.fps.toFixed(1)}fps

以下是从视频中按时间顺序等间隔提取的 ${frames.length} 个关键帧截图：`,
  });

  // Add each frame as an image with timestamp
  for (const frame of frames) {
    imageBlocks.push({
      type: 'text',
      text: `\n--- 关键帧 #${frame.index + 1} (时间点: ${frame.timestamp}秒) ---`,
    });
    imageBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: frame.base64,
      },
    });
  }

  // Add the analysis prompt
  imageBlocks.push({
    type: 'text',
    text: `
请你作为短视频营销专家，对这个视频进行全面的拆解分析。请严格按照以下 JSON 格式返回分析结果（不要包含任何其他文字，只返回 JSON）：

{
  "shots": [
    {
      "id": 1,
      "startTime": 0.0,
      "endTime": 2.0,
      "type": "开头钩子|痛点放大|产品展示|使用场景|效果对比|行动引导|信任背书|其他",
      "description": "画面详细描述（中文）",
      "narration": "推测的文案/口播内容（中文）",
      "hasProduct": false
    }
  ],
  "titleAnalysis": {
    "title": "推测的视频标题（中文）",
    "keywords": ["关键词1", "关键词2"],
    "emotionalTrigger": "使用的情绪触发点",
    "targetAudience": "目标受众描述"
  },
  "hookAnalysis": {
    "hookType": "钩子类型（如：恐惧型/好奇型/利益型/共鸣型/反常识型）",
    "hookDescription": "开头钩子的具体描述和分析",
    "hookDuration": 3.0,
    "effectiveness": "钩子效果评分和原因分析"
  },
  "contentStructure": {
    "pattern": "内容结构模式名称（如：痛点-方案-效果、问题-产品-转化 等）",
    "phases": [
      {
        "name": "阶段名称",
        "startTime": 0.0,
        "endTime": 5.0,
        "purpose": "该阶段目的",
        "technique": "使用的技巧"
      }
    ]
  },
  "emotionCurve": {
    "overall": "整体情绪走向描述",
    "peaks": [
      {
        "time": 5.0,
        "emotion": "情绪类型（焦虑/好奇/惊喜/信任/紧迫等）",
        "trigger": "触发该情绪的具体元素"
      }
    ],
    "rhythm": "情绪节奏分析（如：先抑后扬、层层递进、高开高走等）"
  },
  "scriptAnalysis": {
    "fullScript": "根据画面推测的完整口播文案",
    "wordCount": 150,
    "paceWordsPerSecond": 4.5,
    "toneStyle": "文案风格（如：口语化/专业/情感化/幽默等）",
    "keyPhrases": ["关键金句1", "关键金句2"],
    "callToAction": "行动引导话术"
  },
  "overallScore": 85,
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["不足1", "不足2"],
  "optimizationTip": "最核心的一条优化建议"
}

注意事项：
1. shots 数组中的每个镜头应该对应一个场景切换，根据画面内容变化来判断
2. 时间戳应该基于提供的关键帧时间点来推算
3. type 必须是以下之一：开头钩子、痛点放大、产品展示、使用场景、效果对比、行动引导、信任背书、其他
4. hasProduct 为 true 表示该镜头中出现了产品实物
5. overallScore 范围 0-100
6. 分析要深入专业，像一个资深短视频运营专家一样给出有价值的洞察`,
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: imageBlocks,
      },
    ],
  });

  // Extract JSON from response
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  let jsonStr = textContent.text.trim();
  // Strip markdown code block if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Build the VideoAnalysis object
  const shots: Shot[] = (parsed.shots || []).map((s: Record<string, unknown>, i: number) => ({
    id: i + 1,
    startTime: Number(s.startTime) || 0,
    endTime: Number(s.endTime) || 0,
    type: normalizeShotType(s.type as string),
    description: String(s.description || ''),
    narration: String(s.narration || ''),
    hasProduct: Boolean(s.hasProduct),
    thumbnailUrl: `/api/frames/${fileName}/${i}`,
  }));

  // Calculate product metrics
  const productShots = shots.filter(s => s.hasProduct);
  const firstProductShot = productShots[0];
  const firstProductAppearance = firstProductShot ? firstProductShot.startTime : metadata.duration;
  const productExposureDuration = productShots.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  const productExposurePercent = Math.round((productExposureDuration / metadata.duration) * 100);

  return {
    id: Math.random().toString(36).substr(2, 9),
    fileName,
    videoDuration: Math.round(metadata.duration * 10) / 10,
    firstProductAppearance: Math.round(firstProductAppearance * 10) / 10,
    productExposureDuration: Math.round(productExposureDuration * 10) / 10,
    productExposurePercent,
    shotCount: shots.length,
    shots,
    optimizationTip: parsed.optimizationTip || '暂无优化建议',
    titleAnalysis: parsed.titleAnalysis || {
      title: '未能分析标题',
      keywords: [],
      emotionalTrigger: '',
      targetAudience: '',
    },
    hookAnalysis: parsed.hookAnalysis || {
      hookType: '',
      hookDescription: '',
      hookDuration: 0,
      effectiveness: '',
    },
    contentStructure: parsed.contentStructure || {
      pattern: '',
      phases: [],
    },
    emotionCurve: parsed.emotionCurve || {
      overall: '',
      peaks: [],
      rhythm: '',
    },
    scriptAnalysis: parsed.scriptAnalysis || {
      fullScript: '',
      wordCount: 0,
      paceWordsPerSecond: 0,
      toneStyle: '',
      keyPhrases: [],
      callToAction: '',
    },
    overallScore: parsed.overallScore || 0,
    strengths: parsed.strengths || [],
    weaknesses: parsed.weaknesses || [],
  };
}

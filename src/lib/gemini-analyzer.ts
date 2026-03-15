import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import { VideoMetadata } from './video-processing';
import { VideoAnalysis, Shot, ShotType } from './types';
import fs from 'fs';
import path from 'path';

const VALID_SHOT_TYPES: ShotType[] = ['痛点放大', '产品展示', '使用场景', '效果对比', '行动引导', '开头钩子', '信任背书', '其他'];

function normalizeShotType(type: string): ShotType {
  if (VALID_SHOT_TYPES.includes(type as ShotType)) return type as ShotType;
  return '其他';
}

/**
 * Get the MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
  };
  return mimeMap[ext] || 'video/mp4';
}

/**
 * Upload video to Gemini Files API and wait for it to become ACTIVE
 */
async function uploadVideoToGemini(
  ai: GoogleGenAI,
  videoPath: string,
): Promise<{ uri: string; mimeType: string }> {
  const mimeType = getMimeType(videoPath);

  // Upload via the Files API
  const uploadResult = await ai.files.upload({
    file: videoPath,
    config: { mimeType },
  });

  if (!uploadResult.uri || !uploadResult.name) {
    throw new Error('文件上传失败：未返回文件 URI');
  }

  // Poll until file is ACTIVE (video processing takes time)
  let file = uploadResult;
  const maxWait = 120_000; // 2 minutes max
  const pollInterval = 3_000;
  let waited = 0;

  while (file.state === 'PROCESSING' && waited < maxWait) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    waited += pollInterval;
    file = await ai.files.get({ name: file.name! });
  }

  if (file.state !== 'ACTIVE') {
    throw new Error(`视频处理超时或失败，状态: ${file.state}`);
  }

  return { uri: file.uri!, mimeType };
}

/**
 * Analyze a video file using Google Gemini API with native video understanding
 */
export async function analyzeVideoWithGemini(
  videoPath: string,
  metadata: VideoMetadata,
  fileName: string,
): Promise<VideoAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please set it in your .env file.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Step 1: Upload video to Gemini Files API
  const { uri, mimeType } = await uploadVideoToGemini(ai, videoPath);

  // Step 2: Build the analysis prompt
  const analysisPrompt = `你是一个资深短视频营销专家和爆款内容分析师。请对这个短视频进行全面的拆解分析。

视频信息:
- 文件名: "${fileName}"
- 视频时长: ${metadata.duration.toFixed(1)}秒
- 分辨率: ${metadata.width}x${metadata.height}

请仔细观看整个视频（包括画面和音频），然后严格按照以下 JSON 格式返回分析结果。
不要包含任何其他文字、解释或 markdown 标记，只返回纯 JSON：

{
  "shots": [
    {
      "id": 1,
      "startTime": 0.0,
      "endTime": 2.0,
      "type": "开头钩子|痛点放大|产品展示|使用场景|效果对比|行动引导|信任背书|其他",
      "description": "画面详细描述（中文）",
      "narration": "该镜头对应的文案/口播/字幕内容（中文，如果能听到或看到字幕请如实转录）",
      "hasProduct": false
    }
  ],
  "titleAnalysis": {
    "title": "推测或识别出的视频标题（中文）",
    "keywords": ["关键词1", "关键词2", "关键词3"],
    "emotionalTrigger": "使用的情绪触发点分析",
    "targetAudience": "目标受众画像描述"
  },
  "hookAnalysis": {
    "hookType": "钩子类型（恐惧型/好奇型/利益型/共鸣型/反常识型/悬念型/冲突型）",
    "hookDescription": "开头钩子的具体手法描述和分析",
    "hookDuration": 3.0,
    "effectiveness": "钩子效果评估和原因分析（包含为什么有效或无效）"
  },
  "contentStructure": {
    "pattern": "内容结构模式名称（如：痛点-方案-效果、问题-产品-转化、故事-植入-引导 等）",
    "phases": [
      {
        "name": "阶段名称",
        "startTime": 0.0,
        "endTime": 5.0,
        "purpose": "该阶段的核心目的",
        "technique": "使用的具体拍摄/编辑/营销技巧"
      }
    ]
  },
  "emotionCurve": {
    "overall": "整体情绪走向描述（从开头到结尾观众情绪如何变化）",
    "peaks": [
      {
        "time": 5.0,
        "emotion": "情绪类型（焦虑/好奇/惊喜/信任/紧迫/恐惧/兴奋/感动等）",
        "trigger": "触发该情绪的具体画面或文案元素"
      }
    ],
    "rhythm": "情绪节奏总结（如：先抑后扬、层层递进、高开高走、波浪式推进等）"
  },
  "scriptAnalysis": {
    "fullScript": "完整的口播文案/字幕文案转录（如果有音频请尽可能准确转录）",
    "wordCount": 150,
    "paceWordsPerSecond": 4.5,
    "toneStyle": "文案整体风格（口语化/专业权威/情感共鸣/幽默搞笑/恐惧营销/种草安利等）",
    "keyPhrases": ["关键金句1", "关键金句2", "关键金句3"],
    "callToAction": "结尾的行动引导话术（完整引用）"
  },
  "overallScore": 85,
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["不足1", "不足2"],
  "optimizationTip": "最核心的一条优化建议（具体可执行）"
}

分析要求：
1. shots 数组：根据画面场景切换来划分镜头，每个场景变化都应该是一个新镜头
2. 时间戳：尽可能精确到0.1秒
3. type 必须是：开头钩子、痛点放大、产品展示、使用场景、效果对比、行动引导、信任背书、其他
4. hasProduct：当镜头中出现产品实物时为 true
5. narration：如果视频有语音，请尽可能准确转录；如果有字幕，请提取字幕内容
6. overallScore：0-100 分，从完播率、转化力、创意性、节奏感等维度综合评分
7. 请像一个月薪5万的资深短视频运营专家一样，给出真正有价值、可执行的专业洞察`;

  // Step 3: Call Gemini generateContent with the uploaded video
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: createUserContent([
      createPartFromUri(uri, mimeType),
      analysisPrompt,
    ]),
  });

  // Step 4: Parse the response
  const text = response.text;
  if (!text) {
    throw new Error('Gemini 未返回分析结果');
  }

  let jsonStr = text.trim();
  // Strip markdown code block if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Try to extract JSON from the response more aggressively
    const startIdx = jsonStr.indexOf('{');
    const endIdx = jsonStr.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      parsed = JSON.parse(jsonStr.slice(startIdx, endIdx + 1));
    } else {
      throw new Error('无法解析 Gemini 返回的 JSON 数据');
    }
  }

  // Step 5: Build the VideoAnalysis object
  const shots: Shot[] = (parsed.shots || []).map((s: Record<string, unknown>, i: number) => ({
    id: i + 1,
    startTime: Number(s.startTime) || 0,
    endTime: Number(s.endTime) || 0,
    type: normalizeShotType(s.type as string),
    description: String(s.description || ''),
    narration: String(s.narration || ''),
    hasProduct: Boolean(s.hasProduct),
    thumbnailUrl: `/api/frames/${encodeURIComponent(fileName)}/${i}`,
  }));

  // Calculate product metrics
  const productShots = shots.filter(s => s.hasProduct);
  const firstProductShot = productShots[0];
  const firstProductAppearance = firstProductShot ? firstProductShot.startTime : metadata.duration;
  const productExposureDuration = productShots.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  const productExposurePercent = metadata.duration > 0
    ? Math.round((productExposureDuration / metadata.duration) * 100)
    : 0;

  // Step 6: Clean up the uploaded file from Gemini (best effort)
  try {
    const files = await ai.files.list();
    for await (const f of files) {
      if (f.uri === uri && f.name) {
        await ai.files.delete({ name: f.name });
        break;
      }
    }
  } catch {
    // ignore cleanup errors
  }

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

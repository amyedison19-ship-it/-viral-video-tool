import { GoogleGenerativeAI } from '@google/generative-ai';
import { VideoMetadata } from './video-processing';
import { VideoAnalysis, Shot, ShotType } from './types';

const VALID_SHOT_TYPES: ShotType[] = ['痛点放大', '产品展示', '使用场景', '效果对比', '行动引导', '开头钩子', '信任背书', '其他'];

function normalizeShotType(type: string): ShotType {
  if (VALID_SHOT_TYPES.includes(type as ShotType)) return type as ShotType;
  return '其他';
}

function buildAnalysisPrompt(fileName: string, metadata: VideoMetadata): string {
  return `你是一个资深短视频营销专家和爆款内容分析师。请对这个短视频进行全面的拆解分析。

视频信息:
- 文件名: "${fileName}"
- 视频时长: ${metadata.duration > 0 ? metadata.duration.toFixed(1) + '秒' : '未知'}
- 分辨率: ${metadata.width > 0 ? metadata.width + 'x' + metadata.height : '未知'}

请仔细观看整个视频（包括画面和音频），然后严格按照以下 JSON 格式返回分析结果。
不要包含任何其他文字、解释或 markdown 标记，只返回纯 JSON：

{
  "videoDuration": 30.0,
  "shots": [
    {
      "id": 1,
      "startTime": 0.0,
      "endTime": 2.0,
      "type": "开头钩子|痛点放大|产品展示|使用场景|效果对比|行动引导|信任背书|其他",
      "description": "画面详细描述（中文）",
      "narration": "该镜头对应的文案/口播/字幕内容（原始语言，如实转录听到的语音或看到的字幕）",
      "narrationChinese": "narration的中文翻译（如果原文已经是中文则留空字符串）",
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
    "detectedLanguage": "视频口播/字幕的原始语言（如：English、Español、中文、日本語、한국어等）",
    "fullScript": "完整的口播文案/字幕文案转录（保留原始语言，如实转录）",
    "fullScriptChinese": "fullScript的完整中文翻译（如果原文已经是中文则留空字符串）",
    "wordCount": 150,
    "paceWordsPerSecond": 4.5,
    "toneStyle": "文案整体风格（口语化/专业权威/情感共鸣/幽默搞笑/恐惧营销/种草安利等）",
    "keyPhrases": ["关键金句1", "关键金句2", "关键金句3"],
    "callToAction": "结尾的行动引导话术（原始语言完整引用）",
    "callToActionChinese": "callToAction的中文翻译（如果原文已经是中文则留空字符串）"
  },
  "productAppearance": {
    "name": "产品的完整名称（品牌+型号，如 Sony LinkBuds Clip）",
    "brand": "产品品牌（如 Sony）",
    "category": "产品品类（如 耳夹式耳机）",
    "detailedDescription": "产品的详细外观描述，包括形状、大小、材质、配件等（如：小巧的耳夹式无线耳机，配有圆形充电盒，耳机本体为环形夹耳设计）",
    "color": "产品颜色（如 浅绿色/薄荷绿）",
    "shape": "产品形状（如 环形耳夹+圆形充电盒）",
    "distinguishingFeatures": ["特征1（如 耳机上有SONY品牌标识）", "特征2（如 开放式耳夹设计，不入耳）", "特征3（如 充电盒可打开，内有两个耳机插槽）"]
  },
  "overallScore": 85,
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["不足1", "不足2"],
  "optimizationTip": "最核心的一条优化建议（具体可执行）"
}

分析要求：
1. videoDuration：请根据视频实际时长填写（秒）
2. shots 数组：根据画面场景切换来划分镜头，每个场景变化都应该是一个新镜头
3. 时间戳：尽可能精确到0.1秒
4. type 必须是：开头钩子、痛点放大、产品展示、使用场景、效果对比、行动引导、信任背书、其他
5. hasProduct：当镜头中出现产品实物时为 true
6. narration：如果视频有语音，请用原始语言尽可能准确转录；如果有字幕，请提取原始字幕内容。narrationChinese：如果原始语言不是中文，请提供中文翻译；如果原文已是中文，留空字符串
7. detectedLanguage：请识别视频口播/字幕的原始语言。fullScript保留原始语言转录，fullScriptChinese提供中文翻译（原文为中文时留空）
8. overallScore：0-100 分，从完播率、转化力、创意性、节奏感等维度综合评分
9. productAppearance：请仔细观察视频中出现的产品，详细描述其外观特征（品牌、颜色、形状、材质、尺寸、配件等），这些信息将用于生成新视频时保持产品一致性
10. 请像一个月薪5万的资深短视频运营专家一样，给出真正有价值、可执行的专业洞察`;
}

function sanitizeJsonString(str: string): string {
  // Remove trailing commas before } or ]
  let result = str.replace(/,\s*([}\]])/g, '$1');
  // Fix unescaped newlines inside string values
  result = result.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
  // Remove control characters that break JSON
  result = result.replace(/[\x00-\x1f\x7f]/g, (ch) => {
    if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
    return '';
  });
  return result;
}

function parseGeminiResponse(text: string): Record<string, unknown> {
  let jsonStr = text.trim();

  // Strip markdown code block if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Extract JSON object boundaries
  const startIdx = jsonStr.indexOf('{');
  const endIdx = jsonStr.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    jsonStr = jsonStr.slice(startIdx, endIdx + 1);
  }

  // Try direct parse first
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try with sanitization
  }

  // Sanitize common LLM JSON issues and retry
  const sanitized = sanitizeJsonString(jsonStr);
  try {
    return JSON.parse(sanitized);
  } catch {
    // Try more aggressive fix
  }

  // Last resort: try to fix truncated JSON by closing open brackets/braces
  try {
    let fixed = sanitized;
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;
    for (const ch of fixed) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') openBraces++;
      else if (ch === '}') openBraces--;
      else if (ch === '[') openBrackets++;
      else if (ch === ']') openBrackets--;
    }
    // Close any unclosed strings/arrays/objects
    if (inString) fixed += '"';
    while (openBrackets > 0) { fixed += ']'; openBrackets--; }
    while (openBraces > 0) { fixed += '}'; openBraces--; }
    // Remove trailing commas again after fixes
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(fixed);
  } catch (e) {
    console.error('Gemini raw response (first 1000 chars):', text.slice(0, 1000));
    console.error('Parse error:', e);
    throw new Error('无法解析 Gemini 返回的 JSON 数据，请重试');
  }
}

function buildVideoAnalysis(
  parsed: Record<string, unknown>,
  fileName: string,
  metadata: VideoMetadata,
): VideoAnalysis {
  const p = parsed as Record<string, unknown>;

  // Use duration from Gemini response if we don't have it from metadata
  const videoDuration = metadata.duration > 0
    ? metadata.duration
    : Number(p.videoDuration) || 0;

  const shots: Shot[] = ((p.shots as Record<string, unknown>[]) || []).map(
    (s: Record<string, unknown>, i: number) => ({
      id: i + 1,
      startTime: Number(s.startTime) || 0,
      endTime: Number(s.endTime) || 0,
      type: normalizeShotType(s.type as string),
      description: String(s.description || ''),
      narration: String(s.narration || ''),
      narrationChinese: String(s.narrationChinese || ''),
      hasProduct: Boolean(s.hasProduct),
      thumbnailUrl: `/api/placeholder/shot/${i + 1}`,
    })
  );

  const productShots = shots.filter(s => s.hasProduct);
  const firstProductShot = productShots[0];
  const firstProductAppearance = firstProductShot
    ? firstProductShot.startTime
    : videoDuration;
  const productExposureDuration = productShots.reduce(
    (sum, s) => sum + (s.endTime - s.startTime), 0
  );
  const productExposurePercent = videoDuration > 0
    ? Math.round((productExposureDuration / videoDuration) * 100)
    : 0;

  const productAppearance = p.productAppearance as Record<string, unknown> | undefined;
  const titleAnalysis = p.titleAnalysis as Record<string, unknown> | undefined;
  const hookAnalysis = p.hookAnalysis as Record<string, unknown> | undefined;
  const contentStructure = p.contentStructure as Record<string, unknown> | undefined;
  const emotionCurve = p.emotionCurve as Record<string, unknown> | undefined;
  const scriptAnalysis = p.scriptAnalysis as Record<string, unknown> | undefined;

  return {
    id: Math.random().toString(36).substr(2, 9),
    fileName,
    videoDuration: Math.round(videoDuration * 10) / 10,
    firstProductAppearance: Math.round(firstProductAppearance * 10) / 10,
    productExposureDuration: Math.round(productExposureDuration * 10) / 10,
    productExposurePercent,
    shotCount: shots.length,
    shots,
    optimizationTip: String(p.optimizationTip || '暂无优化建议'),
    productAppearance: productAppearance ? {
      name: String(productAppearance.name || ''),
      brand: String(productAppearance.brand || ''),
      category: String(productAppearance.category || ''),
      detailedDescription: String(productAppearance.detailedDescription || ''),
      color: String(productAppearance.color || ''),
      shape: String(productAppearance.shape || ''),
      distinguishingFeatures: (productAppearance.distinguishingFeatures as string[]) || [],
    } : undefined,
    titleAnalysis: {
      title: String(titleAnalysis?.title || ''),
      keywords: (titleAnalysis?.keywords as string[]) || [],
      emotionalTrigger: String(titleAnalysis?.emotionalTrigger || ''),
      targetAudience: String(titleAnalysis?.targetAudience || ''),
    },
    hookAnalysis: {
      hookType: String(hookAnalysis?.hookType || ''),
      hookDescription: String(hookAnalysis?.hookDescription || ''),
      hookDuration: Number(hookAnalysis?.hookDuration) || 0,
      effectiveness: String(hookAnalysis?.effectiveness || ''),
    },
    contentStructure: {
      pattern: String(contentStructure?.pattern || ''),
      phases: ((contentStructure?.phases as Record<string, unknown>[]) || []).map(
        (phase: Record<string, unknown>) => ({
          name: String(phase.name || ''),
          startTime: Number(phase.startTime) || 0,
          endTime: Number(phase.endTime) || 0,
          purpose: String(phase.purpose || ''),
          technique: String(phase.technique || ''),
        })
      ),
    },
    emotionCurve: {
      overall: String(emotionCurve?.overall || ''),
      peaks: ((emotionCurve?.peaks as Record<string, unknown>[]) || []).map(
        (peak: Record<string, unknown>) => ({
          time: Number(peak.time) || 0,
          emotion: String(peak.emotion || ''),
          trigger: String(peak.trigger || ''),
        })
      ),
      rhythm: String(emotionCurve?.rhythm || ''),
    },
    scriptAnalysis: {
      detectedLanguage: String(scriptAnalysis?.detectedLanguage || '中文'),
      fullScript: String(scriptAnalysis?.fullScript || ''),
      fullScriptChinese: String(scriptAnalysis?.fullScriptChinese || ''),
      wordCount: Number(scriptAnalysis?.wordCount) || 0,
      paceWordsPerSecond: Number(scriptAnalysis?.paceWordsPerSecond) || 0,
      toneStyle: String(scriptAnalysis?.toneStyle || ''),
      keyPhrases: (scriptAnalysis?.keyPhrases as string[]) || [],
      callToAction: String(scriptAnalysis?.callToAction || ''),
      callToActionChinese: String(scriptAnalysis?.callToActionChinese || ''),
    },
    overallScore: Number(p.overallScore) || 0,
    strengths: (p.strengths as string[]) || [],
    weaknesses: (p.weaknesses as string[]) || [],
  };
}

/**
 * Wait for a Gemini file to become ACTIVE (processing complete).
 * Files go through PROCESSING → ACTIVE after upload.
 */
async function waitForFileActive(fileUri: string, apiKey: string, maxWaitMs = 120000): Promise<void> {
  // Extract file name from URI like "https://generativelanguage.googleapis.com/v1beta/files/abc123"
  const fileNameMatch = fileUri.match(/files\/([^/]+)$/);
  if (!fileNameMatch) return; // Can't poll, just try to use it

  const fileName = fileNameMatch[1];
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/files/${fileName}?key=${apiKey}`
    );

    if (res.ok) {
      const data = await res.json();
      const state = data.state || data.file?.state;
      if (state === 'ACTIVE') return;
      if (state === 'FAILED') throw new Error('Gemini 文件处理失败，请重新上传');
    }

    // Wait 2 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('等待文件处理超时，请重试');
}

/**
 * Analyze a video using a Gemini file URI (video already uploaded to Gemini by client).
 * This is the main function used for Vercel-compatible deployment.
 */
export async function analyzeWithGeminiByUri(
  fileUri: string,
  mimeType: string,
  metadata: VideoMetadata,
  fileName: string,
): Promise<VideoAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 未设置。请在 .env 文件中配置 GEMINI_API_KEY。');
  }

  // Wait for file to finish processing before analyzing
  await waitForFileActive(fileUri, apiKey);

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildAnalysisPrompt(fileName, metadata);

  const contentParts = [
    {
      fileData: {
        mimeType,
        fileUri,
      },
    },
    { text: prompt },
  ];

  // Try multiple models with retry on 503/overload
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError: Error | null = null;

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`Trying ${modelName} (attempt ${attempt + 1})...`);
        const result = await model.generateContent(contentParts);

        const text = result.response.text();
        if (!text) {
          throw new Error('Gemini 未返回分析结果');
        }

        try {
          const parsed = parseGeminiResponse(text);
          return buildVideoAnalysis(parsed, fileName, metadata);
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e));
          console.warn(`${modelName} JSON parse attempt ${attempt + 1} failed, retrying...`);
        }
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        const msg = lastError.message || '';
        const isOverload = msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand') || msg.includes('Service Unavailable') || msg.includes('RESOURCE_EXHAUSTED');
        const isQuota = msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota');
        if (isOverload || isQuota) {
          console.warn(`${modelName} ${isQuota ? 'quota exceeded' : 'overloaded'} (attempt ${attempt + 1}), ${attempt < 1 ? 'retrying...' : 'trying next model...'}`);
          if (attempt < 1) {
            await new Promise(resolve => setTimeout(resolve, isQuota ? 10000 : 3000));
            continue;
          }
          break; // Move to next model
        }
        throw lastError;
      }
    }
  }

  // Provide user-friendly error message
  const errMsg = lastError?.message || '';
  if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Too Many Requests')) {
    throw new Error('Gemini API 配额已用完，请等待 1-2 分钟后重试，或在 Google AI Studio 升级为付费计划');
  }
  if (errMsg.includes('503') || errMsg.includes('overloaded')) {
    throw new Error('Gemini 服务器繁忙，请等待 1 分钟后点击"重新分析"重试');
  }
  throw lastError || new Error('所有 Gemini 模型暂时不可用，请稍后重试');
}

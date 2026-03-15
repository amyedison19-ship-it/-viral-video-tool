export type ShotType = '痛点放大' | '产品展示' | '使用场景' | '效果对比' | '行动引导' | '开头钩子' | '信任背书' | '其他';

export interface Shot {
  id: number;
  startTime: number;
  endTime: number;
  type: ShotType;
  description: string;
  narration: string;
  hasProduct: boolean;
  thumbnailUrl: string;
}

export interface VideoAnalysis {
  id: string;
  fileName: string;
  videoDuration: number;
  firstProductAppearance: number;
  productExposureDuration: number;
  productExposurePercent: number;
  shotCount: number;
  shots: Shot[];
  optimizationTip: string;

  // New fields from Claude analysis
  titleAnalysis: {
    title: string;
    keywords: string[];
    emotionalTrigger: string;
    targetAudience: string;
  };
  hookAnalysis: {
    hookType: string;
    hookDescription: string;
    hookDuration: number;
    effectiveness: string;
  };
  contentStructure: {
    pattern: string;
    phases: {
      name: string;
      startTime: number;
      endTime: number;
      purpose: string;
      technique: string;
    }[];
  };
  emotionCurve: {
    overall: string;
    peaks: {
      time: number;
      emotion: string;
      trigger: string;
    }[];
    rhythm: string;
  };
  scriptAnalysis: {
    fullScript: string;
    wordCount: number;
    paceWordsPerSecond: number;
    toneStyle: string;
    keyPhrases: string[];
    callToAction: string;
  };
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
}

export interface CrossCategoryScript {
  productName: string;
  scenes: {
    type: ShotType;
    englishDescription: string;
    chineseDescription: string;
    hook: string;
    title: string;
    recommendation?: string;
  }[];
}

export interface VideoGenerationConfig {
  model: 'fast' | 'quality';
  format: 'portrait' | 'landscape';
  script: CrossCategoryScript;
  prompt: string;
}

export interface SameProductScript {
  scenarioName: string;
  scenes: {
    type: ShotType;
    originalDescription: string;
    newDescription: string;
    narration: string;
    shootingTip: string;
  }[];
}

export type TabType = 'shots' | 'storyboard' | 'deep-analysis' | 'structure' | 'same-product' | 'ai-video' | 'export';

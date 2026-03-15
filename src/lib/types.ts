export type ShotType = '痛点放大' | '产品展示' | '使用场景' | '效果对比' | '行动引导';

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

export type TabType = 'shots' | 'storyboard' | 'structure' | 'ai-video' | 'export';

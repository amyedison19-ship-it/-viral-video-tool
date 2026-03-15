import { VideoAnalysis, CrossCategoryScript, SameProductScript } from './types';

export function generateMockAnalysis(fileName: string): VideoAnalysis {
  const shots = [
    {
      id: 1, startTime: 0.0, endTime: 5.0, type: '痛点放大' as const,
      description: '皮肤特写镜头，显示一个红色的开放性伤口/洞，用棉签在清理，画面恶心引发不适感；继续皮肤伤口特写，伤口更加明显，用棉签摸拭伤口内部，画面令人不适',
      narration: '洗完的衣服穿在身上发痒，教你一招搞定；如果你的洗衣机超过半年不清洁',
      hasProduct: false,
      thumbnailUrl: '/api/placeholder/shot/1',
    },
    {
      id: 2, startTime: 5.0, endTime: 10.0, type: '痛点放大' as const,
      description: '洗衣机内筒特写，显示脏污的洗衣机内部，有人戴手套在清理；洗衣机内筒继续展示，可以看到内筒壁上的污垢和细菌',
      narration: '一台使用半年差不清洁的洗衣机；污垢细菌内容比马桶还要多5倍',
      hasProduct: false,
      thumbnailUrl: '/api/placeholder/shot/2',
    },
    {
      id: 3, startTime: 10.0, endTime: 12.0, type: '痛点放大' as const,
      description: '人物拿着一件白色衣服的画面，暗示衣服受到污染；人物继续拿着白色衣服，表现出不适的样子',
      narration: '这些细菌不仅会让你身上发痒',
      hasProduct: false,
      thumbnailUrl: '/api/placeholder/shot/3',
    },
    {
      id: 4, startTime: 12.0, endTime: 13.9, type: '痛点放大' as const,
      description: '卡通插画，显示老人给小孩喂东西，表现家里老人和小孩的健康风险；卡通插画继续，老人和小孩周围出现绿色细菌图标，强调健康威胁',
      narration: '还会伤害家比较弱的老人和小孩',
      hasProduct: false,
      thumbnailUrl: '/api/placeholder/shot/4',
    },
    {
      id: 5, startTime: 13.9, endTime: 16.9, type: '痛点放大' as const,
      description: '洗衣机内筒俯视图，显示脏污的内筒，有细菌和霉菌的标识圆图；洗衣机内筒俯视图，增加了更多细菌霉菌标识圆图，强调污染严重程度',
      narration: '引发共鸣，放大痛点焦虑',
      hasProduct: false,
      thumbnailUrl: '/api/placeholder/shot/5',
    },
    {
      id: 6, startTime: 16.9, endTime: 18.9, type: '产品展示' as const,
      description: '产品首次出现，展示洗衣机清洁剂产品包装，突出产品外观和品牌',
      narration: '只需要一招就能搞定，这款洗衣机槽清洁剂',
      hasProduct: true,
      thumbnailUrl: '/api/placeholder/shot/6',
    },
    {
      id: 7, startTime: 18.9, endTime: 19.9, type: '使用场景' as const,
      description: '展示将清洁剂倒入洗衣机的过程，演示使用方法',
      narration: '直接倒入洗衣机内',
      hasProduct: true,
      thumbnailUrl: '/api/placeholder/shot/7',
    },
    {
      id: 8, startTime: 19.9, endTime: 20.9, type: '产品展示' as const,
      description: '产品近距离展示，突出产品细节和功能特点',
      narration: '活性酶配方，深层清洁',
      hasProduct: true,
      thumbnailUrl: '/api/placeholder/shot/8',
    },
    {
      id: 9, startTime: 20.9, endTime: 23.9, type: '使用场景' as const,
      description: '展示洗衣机运行清洁程序的画面，泡沫翻涌',
      narration: '选择桶自洁模式，运行一次就干净了',
      hasProduct: true,
      thumbnailUrl: '/api/placeholder/shot/9',
    },
    {
      id: 10, startTime: 23.9, endTime: 25.9, type: '产品展示' as const,
      description: '展示清洁后的效果，洗衣机内筒变得干净光亮',
      narration: '清洁前后对比明显',
      hasProduct: true,
      thumbnailUrl: '/api/placeholder/shot/10',
    },
    {
      id: 11, startTime: 25.9, endTime: 27.9, type: '效果对比' as const,
      description: '清洁前后对比画面，左边脏污右边干净',
      narration: '看看这个效果，简直焕然一新',
      hasProduct: false,
      thumbnailUrl: '/api/placeholder/shot/11',
    },
    {
      id: 12, startTime: 27.9, endTime: 29.9, type: '使用场景' as const,
      description: '展示清洁后洗出的衣服，干净清新',
      narration: '洗出来的衣服再也不会发痒了',
      hasProduct: false,
      thumbnailUrl: '/api/placeholder/shot/12',
    },
    {
      id: 13, startTime: 29.9, endTime: 31.9, type: '使用场景' as const,
      description: '家庭场景，展示家人穿着干净衣服的画面',
      narration: '家人的健康从洗衣机清洁开始',
      hasProduct: false,
      thumbnailUrl: '/api/placeholder/shot/13',
    },
    {
      id: 14, startTime: 31.9, endTime: 33.0, type: '产品展示' as const,
      description: '产品最终展示，配合促销信息',
      narration: '现在下单买二送一',
      hasProduct: true,
      thumbnailUrl: '/api/placeholder/shot/14',
    },
    {
      id: 15, startTime: 33.0, endTime: 34.0, type: '行动引导' as const,
      description: '引导用户点击购买，展示购买链接和优惠信息',
      narration: '点击下方链接立即购买，限时优惠',
      hasProduct: true,
      thumbnailUrl: '/api/placeholder/shot/15',
    },
  ];

  return {
    id: Math.random().toString(36).substr(2, 9),
    fileName,
    videoDuration: 34,
    firstProductAppearance: 16.9,
    productExposureDuration: 7.0,
    productExposurePercent: 21,
    shotCount: 15,
    shots,
    optimizationTip: '产品首现时间为16.9秒，建议在5秒内展示产品',
    titleAnalysis: {
      title: '洗完的衣服穿在身上发痒？教你一招搞定',
      keywords: ['洗衣机清洁', '衣服发痒', '细菌', '健康'],
      emotionalTrigger: '恐惧+厌恶感',
      targetAudience: '家庭主妇、注重健康的年轻人',
    },
    hookAnalysis: {
      hookType: '恐惧型',
      hookDescription: '通过展示皮肤伤口的特写画面引发强烈不适感，制造恐惧心理',
      hookDuration: 3,
      effectiveness: '开头3秒使用恐惧型钩子，能有效抓住注意力，但画面可能过于刺激',
    },
    contentStructure: {
      pattern: '痛点-方案-效果',
      phases: [
        { name: '痛点放大', startTime: 0, endTime: 16.9, purpose: '引发恐惧和焦虑', technique: '视觉冲击+数据佐证' },
        { name: '产品展示', startTime: 16.9, endTime: 25.9, purpose: '提供解决方案', technique: '产品特写+使用演示' },
        { name: '效果验证', startTime: 25.9, endTime: 32, purpose: '建立信任', technique: '前后对比' },
        { name: '行动引导', startTime: 32, endTime: 34, purpose: '促进转化', technique: '限时优惠+购买链接' },
      ],
    },
    emotionCurve: {
      overall: '先制造焦虑恐惧，再提供解决方案带来安心感',
      peaks: [
        { time: 3, emotion: '恐惧', trigger: '皮肤伤口特写' },
        { time: 10, emotion: '厌恶', trigger: '脏污洗衣机内筒' },
        { time: 20, emotion: '期待', trigger: '产品使用演示' },
        { time: 28, emotion: '满足', trigger: '清洁前后对比' },
      ],
      rhythm: '先抑后扬',
    },
    scriptAnalysis: {
      fullScript: '洗完的衣服穿在身上发痒，教你一招搞定。如果你的洗衣机超过半年不清洁，一台使用半年差不清洁的洗衣机，污垢细菌内容比马桶还要多5倍。这些细菌不仅会让你身上发痒，还会伤害家比较弱的老人和小孩。只需要一招就能搞定，这款洗衣机槽清洁剂，直接倒入洗衣机内，活性酶配方深层清洁，选择桶自洁模式运行一次就干净了。看看这个效果，简直焕然一新。现在下单买二送一，点击下方链接立即购买，限时优惠。',
      wordCount: 150,
      paceWordsPerSecond: 4.4,
      toneStyle: '口语化+恐惧营销',
      keyPhrases: ['教你一招搞定', '比马桶还要多5倍', '焕然一新', '买二送一'],
      callToAction: '点击下方链接立即购买，限时优惠',
    },
    overallScore: 78,
    strengths: ['开头钩子吸引力强', '痛点挖掘深入', '产品展示清晰', '结尾有行动引导'],
    weaknesses: ['产品出现时间过晚(16.9秒)', '产品露出占比偏低(21%)'],
  };
}

export function generateMockCrossCategoryScript(productName: string): CrossCategoryScript {
  return {
    productName,
    scenes: [
      {
        type: '痛点放大',
        englishDescription: `+Close-up shots of dirty, stagnant water bowls with visible bacteria and algae buildup to create disgust and urgency about pet health`,
        chineseDescription: '特写镜头展现一个脏兮兮的宠物水碗，上面长满了绿藻，漂浮着杂物，周围还有苍蝇；镜头切换到另一个画面，显示碗边缘积累的粘液。',
        hook: 'Dirty Water = Sick Cat!',
        title: "If your cat drinks from dirty water bowls, you're putting their health at risk",
        recommendation: 'Extreme close-up of a dirty pet water bowl with green algae, floating debris, and flies around it; Cut to another shot showing slimy buildup on bowl edges',
      },
      {
        type: '痛点放大',
        englishDescription: `+Show contaminated water sources and emphasize the bacterial danger with visual elements highlighting health risks`,
        chineseDescription: '分屏显示马桶和脏宠物水碗，水碗上带有动态细菌图标；特写镜头显示静止的水面上漂浮着绿色颗粒。',
        hook: '5x More Bacteria Than Toilet!',
        title: 'Standing water in pet bowls contains 5x more bacteria than toilet water',
      },
      {
        type: '产品展示',
        englishDescription: `+Introduce the automatic water fountain with clean flowing water, emphasizing freshness and filtration`,
        chineseDescription: '产品首次出现，展示猫咪自动饮水机，干净的流水从喷口涌出，猫咪好奇地靠近。',
        hook: 'Fresh Water, Happy Cat!',
        title: 'This automatic water fountain keeps water fresh and filtered 24/7',
      },
      {
        type: '使用场景',
        englishDescription: `+Show the product in use with a happy cat drinking, demonstrating ease of setup and daily use`,
        chineseDescription: '展示猫咪开心地从饮水机喝水的画面，主人在旁边微笑，展示简单的安装过程。',
        hook: 'Easy Setup, Daily Joy!',
        title: 'Set it up in 30 seconds, your cat will love it from day one',
      },
    ],
  };
}

export function generateSameProductScript(
  scenarioName: string,
  analysis: VideoAnalysis,
): SameProductScript {
  return {
    scenarioName,
    scenes: analysis.shots.map((shot) => ({
      type: shot.type,
      originalDescription: shot.description,
      newDescription: `【${scenarioName}场景】${shot.description.replace(/画面|镜头|展示/g, (m) => m)}`,
      narration: shot.narration,
      shootingTip: `在${scenarioName}场景下重新拍摄，保持相同的构图和节奏`,
    })),
  };
}

export function generateVideoPrompt(script: CrossCategoryScript): string {
  return `## Video Style
- Modern, sleek, eye-catching visuals
- Professional lighting and composition
- Dynamic camera movements and smooth transitions
- Fast-paced editing suitable for social media (TikTok, Instagram Reels, YouTube Shorts)
- Clean, minimalist aesthetic with product focus

## Audio Requirements
- Background music: Upbeat, modern, suitable for social media
- Voiceover: Professional English female voice, clear and engaging
- Sound effects: Subtle product interaction sounds

## Scene Breakdown
${script.scenes.map((scene, i) => `Scene ${i + 1} (${scene.type}): ${scene.englishDescription}
  - Visual: ${scene.recommendation || scene.chineseDescription}
  - Voiceover: "${scene.title}"
  - Text overlay: "${scene.hook}"`).join('\n\n')}
`;
}

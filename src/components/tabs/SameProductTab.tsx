'use client';

import { useState } from 'react';
import { VideoAnalysis, SameProductScript, ShotType } from '@/lib/types';
import { typeColors } from '@/lib/shot-colors';

interface Props {
  analysis: VideoAnalysis;
  onScriptGenerated?: (script: SameProductScript) => void;
}

const SCENARIO_PRESETS = [
  { label: '户外场景', value: '户外' },
  { label: '办公室场景', value: '办公室' },
  { label: '家居场景', value: '家居' },
  { label: '街拍场景', value: '街拍' },
];

const CHARACTER_CATEGORIES = [
  {
    category: '性别与年龄',
    presets: [
      { label: '不换人物', value: '', description: '保持原视频人物' },
      { label: '年轻女性', value: '年轻女性（20-30岁）', description: '20-30岁，时尚活力' },
      { label: '年轻男性', value: '年轻男性（20-30岁）', description: '20-30岁，阳光帅气' },
      { label: '中年女性', value: '中年女性（35-50岁）', description: '35-50岁，成熟优雅' },
      { label: '中年男性', value: '中年男性（35-50岁）', description: '35-50岁，稳重可靠' },
      { label: '青少年', value: '青少年（15-20岁）', description: '15-20岁，青春活力' },
      { label: '老年人', value: '老年人（60岁以上）', description: '60岁以上，慈祥亲切' },
    ],
  },
  {
    category: '职业身份',
    presets: [
      { label: '职场白领', value: '职场白领', description: '专业干练，商务风格' },
      { label: '家庭主妇/主夫', value: '家庭主妇/主夫', description: '温馨居家，亲和力强' },
      { label: '大学生', value: '大学生', description: '青春活泼，校园风格' },
      { label: '健身达人', value: '健身达人', description: '运动活力，健康阳光' },
      { label: '时尚博主', value: '时尚博主', description: '潮流前沿，穿搭时尚' },
    ],
  },
  {
    category: '全球多元',
    presets: [
      { label: '欧美模特', value: '欧美风格模特', description: '欧美外形，国际化风格' },
      { label: '东南亚模特', value: '东南亚风格模特', description: '东南亚外形，亲和自然' },
      { label: '日韩模特', value: '日韩风格模特', description: '日韩外形，精致清新' },
      { label: '中东模特', value: '中东风格模特', description: '中东外形，深邃大气' },
      { label: '非洲模特', value: '非洲风格模特', description: '非洲外形，活力热情' },
      { label: '拉美模特', value: '拉美风格模特', description: '拉美外形，热情奔放' },
    ],
  },
];

export default function SameProductTab({ analysis, onScriptGenerated }: Props) {
  const [scenario, setScenario] = useState('');
  const [character, setCharacter] = useState('');
  const [customCharacter, setCustomCharacter] = useState('');
  const [adaptedScript, setAdaptedScript] = useState<SameProductScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerate = async () => {
    if (!scenario.trim()) {
      alert('请输入或选择目标场景');
      return;
    }
    setIsGenerating(true);
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate adapted script based on original analysis
    const selectedCharacter = character || customCharacter;
    const scenes = analysis.shots.map((shot) => {
      const scenarioTips: Record<string, string> = {
        '户外': '选择自然光充足的户外环境，利用环境元素增强真实感',
        '办公室': '在办公桌或会议室场景拍摄，突出职场使用场景',
        '家居': '在温馨的家庭环境中拍摄，营造生活化氛围',
        '街拍': '在城市街头拍摄，增加时尚感和随性感',
      };
      let tip = scenarioTips[scenario] || `在${scenario}场景下拍摄，保持原视频的节奏和构图`;
      if (selectedCharacter) {
        tip += `；模特选择：${selectedCharacter}，注意表现自然真实`;
      }

      return {
        type: shot.type as ShotType,
        originalDescription: shot.description,
        newDescription: generateNewDescription(shot.type, shot.description, scenario, selectedCharacter),
        narration: shot.narration,
        shootingTip: tip,
      };
    });

    const scriptName = selectedCharacter ? `${scenario} + ${selectedCharacter}` : scenario;
    const newScript = { scenarioName: scriptName, scenes };
    setAdaptedScript(newScript);
    onScriptGenerated?.(newScript);
    setIsGenerating(false);
  };

  const copyAllScript = () => {
    if (!adaptedScript) return;
    const text = adaptedScript.scenes
      .map((s, i) => `镜头${i + 1} [${s.type}]\n场景描述：${s.newDescription}\n文案：${s.narration}\n拍摄建议：${s.shootingTip}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🔁</span> 同品复刻
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        保持相同的产品和视频结构，更换拍摄场景和人物模特，快速复刻爆款视频
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Original structure overview */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span>📋</span>
            <span className="text-sm font-medium">原视频结构</span>
            <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              {analysis.shots.length} 个镜头
            </span>
          </div>

          {analysis.shots.map((shot, i) => (
            <div key={i} className="mb-3 flex gap-3 items-start">
              <div className="shrink-0 flex flex-col items-center gap-1">
                <span
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={{ background: typeColors[shot.type] }}
                >
                  {shot.type}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {shot.startTime}-{shot.endTime}s
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm leading-relaxed">{shot.description}</p>
                {shot.narration && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    🎙 {shot.narration}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Scenario selection + adapted script */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span>🎬</span>
            <span className="text-sm font-medium">选择新拍摄场景</span>
          </div>

          {/* Preset scenarios */}
          <div className="flex flex-wrap gap-2 mb-3">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: scenario === preset.value ? 'var(--accent-blue)' : 'var(--bg-card)',
                  color: scenario === preset.value ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${scenario === preset.value ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                }}
                onClick={() => setScenario(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom scenario input */}
          <div className="mb-6">
            <input
              type="text"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="或输入自定义场景，如：健身房、咖啡厅、旅行..."
              className="w-full px-4 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Character/Model selection */}
          <div className="flex items-center gap-2 mb-4">
            <span>👤</span>
            <span className="text-sm font-medium">更换人物模特</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              可选
            </span>
          </div>

          {CHARACTER_CATEGORIES.map((cat) => (
            <div key={cat.category} className="mb-3">
              <span className="text-[11px] mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{cat.category}</span>
              <div className="flex flex-wrap gap-2">
                {cat.presets.map((preset) => (
                  <button
                    key={preset.label}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: character === preset.value ? 'var(--accent-purple, #8b5cf6)' : 'var(--bg-card)',
                      color: character === preset.value ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${character === preset.value ? 'var(--accent-purple, #8b5cf6)' : 'var(--border-color)'}`,
                    }}
                    onClick={() => {
                      setCharacter(preset.value);
                      if (preset.value) setCustomCharacter('');
                    }}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-6">
            <input
              type="text"
              value={customCharacter}
              onChange={(e) => {
                setCustomCharacter(e.target.value);
                if (e.target.value) setCharacter('');
              }}
              placeholder="或输入自定义人物描述，如：中年商务男性、运动风格女生..."
              className="w-full px-4 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Generate button */}
          <div className="mb-6">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full px-4 py-3 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--accent-blue)' }}
            >
              {isGenerating ? '生成中...' : '生成复刻脚本'}
            </button>
          </div>

          {/* Adapted script output */}
          {adaptedScript && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: 'var(--accent-blue)' }}>
                    {adaptedScript.scenarioName}场景
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {adaptedScript.scenes.length} 个镜头
                  </span>
                </div>
                <button
                  className="text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer hover:opacity-80"
                  style={{
                    background: copySuccess ? 'rgba(34,197,94,0.2)' : 'var(--accent-blue)',
                    color: copySuccess ? '#22c55e' : 'white',
                    position: 'relative',
                    zIndex: 10,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyAllScript();
                  }}
                >
                  {copySuccess ? '✅ 已复制' : '📋 复制全部脚本'}
                </button>
              </div>

              <div className="space-y-3">
                {adaptedScript.scenes.map((scene, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                          #{i + 1}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{ background: typeColors[scene.type] }}
                        >
                          {scene.type}
                        </span>
                      </div>
                      <button
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                        onClick={() => navigator.clipboard.writeText(scene.newDescription + '\n' + scene.narration)}
                      >
                        复制
                      </button>
                    </div>

                    <p className="text-sm mb-2">{scene.newDescription}</p>

                    {scene.narration && (
                      <p className="text-sm mb-2" style={{ color: 'var(--accent-blue)' }}>
                        🎙 {scene.narration}
                      </p>
                    )}

                    <div className="flex items-start gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <span className="text-xs">💡</span>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {scene.shootingTip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generateNewDescription(type: string, original: string, scenario: string, character?: string): string {
  const scenarioMap: Record<string, Record<string, string>> = {
    '户外': {
      '开头钩子': `在户外自然光下，`,
      '痛点放大': `户外场景中展示问题，`,
      '产品展示': `在户外环境中展示产品，利用自然光突出产品细节，`,
      '使用场景': `户外实际使用场景，展示产品在户外的便携性和实用性，`,
      '效果对比': `户外环境下的前后效果对比，`,
      '行动引导': `户外场景中做出行动引导，`,
      '信任背书': `户外真实场景中的用户证言，`,
    },
    '办公室': {
      '开头钩子': `办公室环境中，`,
      '痛点放大': `职场环境中展示常见痛点，`,
      '产品展示': `办公桌上展示产品，突出职场实用性，`,
      '使用场景': `在办公室中使用产品，展示工作场景的适用性，`,
      '效果对比': `办公环境中的使用前后对比，`,
      '行动引导': `办公场景中引导购买，`,
      '信任背书': `同事推荐场景，`,
    },
    '家居': {
      '开头钩子': `温馨家居环境中，`,
      '痛点放大': `家庭生活中遇到的问题场景，`,
      '产品展示': `在家中展示产品，营造温馨生活感，`,
      '使用场景': `家庭日常使用场景，展示产品融入生活的自然感，`,
      '效果对比': `家居环境中的前后对比效果，`,
      '行动引导': `家庭场景中做出购买引导，`,
      '信任背书': `家人使用后的真实反馈，`,
    },
    '街拍': {
      '开头钩子': `城市街头，`,
      '痛点放大': `街头场景中展示日常困扰，`,
      '产品展示': `街拍风格展示产品，增加时尚潮流感，`,
      '使用场景': `街头实际使用，展示产品的便携和时尚属性，`,
      '效果对比': `街头场景中的前后对比，`,
      '行动引导': `街头场景中引导关注和购买，`,
      '信任背书': `路人真实反馈和好评，`,
    },
  };

  const prefix = scenarioMap[scenario]?.[type] || `在${scenario}场景中，`;
  let result = prefix + original;
  if (character) {
    result = result.replace(/一只手|手|一个人|一位|某人/g, `${character}`);
    if (!result.includes(character)) {
      result += `（由${character}出镜演示）`;
    }
  }
  return result;
}

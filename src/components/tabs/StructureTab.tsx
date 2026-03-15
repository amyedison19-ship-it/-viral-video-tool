'use client';

import { useState } from 'react';
import { VideoAnalysis, ShotType } from '@/lib/types';
import { generateMockCrossCategoryScript } from '@/lib/mock-data';
import { typeColors } from '@/lib/shot-colors';

interface Props {
  analysis: VideoAnalysis;
}

export default function StructureTab({ analysis }: Props) {
  const [targetProduct, setTargetProduct] = useState('');
  const [adaptedScript, setAdaptedScript] = useState<ReturnType<typeof generateMockCrossCategoryScript> | null>(null);
  const [isAdapting, setIsAdapting] = useState(false);

  const handleAdapt = async () => {
    if (!targetProduct.trim()) {
      alert('请输入目标产品名称');
      return;
    }
    setIsAdapting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAdaptedScript(generateMockCrossCategoryScript(targetProduct));
    setIsAdapting(false);
  };

  // Group consecutive shots by type for structure display
  const structureBlocks: { type: ShotType; startTime: number; endTime: number; shots: typeof analysis.shots; description: string }[] = [];
  let currentBlock: typeof structureBlocks[0] | null = null;

  for (const shot of analysis.shots) {
    if (currentBlock && currentBlock.type === shot.type) {
      currentBlock.endTime = shot.endTime;
      currentBlock.shots.push(shot);
      currentBlock.description += '；' + shot.description;
    } else {
      if (currentBlock) structureBlocks.push(currentBlock);
      currentBlock = {
        type: shot.type,
        startTime: shot.startTime,
        endTime: shot.endTime,
        shots: [shot],
        description: shot.description,
      };
    }
  }
  if (currentBlock) structureBlocks.push(currentBlock);

  return (
    <div>
      {/* Navigation link */}
      <div className="text-right mb-4">
        <span className="text-sm cursor-pointer" style={{ color: 'var(--accent-blue)' }}>
          下一步进入视频生成 →
        </span>
      </div>

      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> 脚本结构分析
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Script structure */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>📄</span>
            分析和拆解文案脚本结构
            <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--bg-card)' }}>
              {analysis.fileName}
            </span>
          </div>

          {structureBlocks.map((block, i) => (
            <div key={i} className="mb-4 flex gap-3">
              <div className="shrink-0">
                <span
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={{ background: typeColors[block.type] }}
                >
                  {block.type}
                </span>
              </div>
              <div className="text-sm leading-relaxed flex-1">
                <p>{block.description}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {block.startTime}-{block.endTime}s ×{block.shots.length}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Cross-category adaptation */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span>🔄</span>
            <span className="text-sm font-medium">将文案脚本进行跨类目复刻</span>
          </div>

          {/* Product input */}
          <div className="flex gap-2 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span>🔄</span>
              <span className="text-sm font-medium">将文案脚本进行跨类目复刻</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={targetProduct}
              onChange={(e) => setTargetProduct(e.target.value)}
              placeholder="输入目标产品，如：猫咪自动饮水机"
              className="flex-1 px-4 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleAdapt}
              disabled={isAdapting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0"
              style={{ background: 'var(--accent-purple)' }}
            >
              {isAdapting ? '生成中...' : '生成改编'}
            </button>
          </div>

          {adaptedScript && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: 'var(--accent-purple)' }}>
                  {adaptedScript.productName}
                </span>
              </div>

              {adaptedScript.scenes.map((scene, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs px-2 py-1 rounded font-medium"
                      style={{ background: typeColors[scene.type] }}
                    >
                      {scene.type}
                    </span>
                    <button
                      className="text-xs px-3 py-1 rounded transition-colors"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                      onClick={() => navigator.clipboard.writeText(scene.englishDescription)}
                    >
                      复制
                    </button>
                  </div>
                  <p className="text-sm mb-2">{scene.englishDescription}</p>
                  <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                    {scene.hook}
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#22c55e' }}>
                    {scene.title}
                  </p>
                  {scene.recommendation && (
                    <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                      推荐镜头：{scene.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

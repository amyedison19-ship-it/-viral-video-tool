'use client';

import { useState } from 'react';
import { VideoAnalysis } from '@/lib/types';
import { generateMockCrossCategoryScript, generateVideoPrompt } from '@/lib/mock-data';
import { typeColors } from '@/lib/shot-colors';

interface Props {
  analysis: VideoAnalysis;
}

export default function AIVideoTab({ analysis }: Props) {
  const [model, setModel] = useState<'fast' | 'quality'>('fast');
  const [format, setFormat] = useState<'portrait' | 'landscape'>('portrait');
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);

  const mockScript = generateMockCrossCategoryScript('猫咪自动饮水机');
  const [prompt, setPrompt] = useState(generateVideoPrompt(mockScript));

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 5000));
    setGeneratedVideos(['video_1.mp4', 'video_2.mp4']);
    setIsGenerating(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>✨</span> AI 生成短视频
        </h2>
        <span className="text-xs px-3 py-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
          Powered by Fal.ai | 由 Fal.ai 提供技术支持
        </span>
      </div>

      {/* Adapted script display */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-400">✓</span>
          <span className="font-medium">已改编脚本：{mockScript.productName}</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {mockScript.scenes.map((scene, i) => (
            <div key={i} className="shrink-0 w-[420px] rounded-lg p-3" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: typeColors[scene.type] }}>
                  Pain 疼痛
                </span>
              </div>
              <p className="text-sm mb-2">{scene.englishDescription}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {scene.chineseDescription}
              </p>
              {/* Progress bar */}
              <div className="mt-2 w-full h-1 rounded-full" style={{ background: 'var(--border-color)' }}>
                <div className="h-full rounded-full" style={{ width: '60%', background: 'var(--accent-blue)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Video prompt editor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">视频生成提示词</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm px-3 py-1 rounded transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--accent-blue)' }}
            >
              ✏️ {isEditing ? '完成编辑' : '完成编辑'}
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            readOnly={!isEditing}
            className="w-full h-[400px] p-4 rounded-xl text-sm leading-relaxed font-mono outline-none resize-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Right: Generation settings */}
        <div className="space-y-6">
          {/* Model selection */}
          <div>
            <h3 className="font-medium mb-3">选择模型</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModel('fast')}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: `2px solid ${model === 'fast' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 ${model === 'fast' ? 'border-purple-500' : 'border-gray-500'}`}>
                    {model === 'fast' && <div className="w-2 h-2 rounded-full m-0.5" style={{ background: 'var(--accent-purple)' }} />}
                  </div>
                  <span className="font-medium text-sm">Kie.ai Veo3.1 (Fast)</span>
                </div>
                <p className="text-xs ml-6" style={{ color: 'var(--text-secondary)' }}>Kie.ai Veo3.1（快速版）</p>
                <span className="inline-block mt-1 ml-6 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>推荐</span>
                <p className="text-xs ml-6 mt-1" style={{ color: 'var(--text-secondary)' }}>快速生成，高质量</p>
                <p className="text-xs ml-6" style={{ color: 'var(--text-secondary)' }}>~$0.30/5秒</p>
              </button>
              <button
                onClick={() => setModel('quality')}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: `2px solid ${model === 'quality' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 ${model === 'quality' ? 'border-purple-500' : 'border-gray-500'}`}>
                    {model === 'quality' && <div className="w-2 h-2 rounded-full m-0.5" style={{ background: 'var(--accent-purple)' }} />}
                  </div>
                  <span className="font-medium text-sm">Kie.ai Veo3.1 (Quality)</span>
                </div>
                <p className="text-xs ml-6" style={{ color: 'var(--text-secondary)' }}>Kie.ai Veo3.1（质量）</p>
                <p className="text-xs ml-6 mt-1" style={{ color: 'var(--text-secondary)' }}>更高质量，更长时间</p>
                <p className="text-xs ml-6" style={{ color: 'var(--text-secondary)' }}>~$0.50/5秒</p>
              </button>
            </div>
          </div>

          {/* Audio note */}
          <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span>🎵</span>
            <span className="text-sm" style={{ color: 'var(--accent-blue)' }}>
              所有模型均支持 AI 配音，自动生成英语语音
            </span>
          </div>

          {/* Format selection */}
          <div>
            <h3 className="font-medium mb-3">视频格式</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat('portrait')}
                className="flex-1 py-3 rounded-full text-sm font-medium transition-all"
                style={{
                  background: format === 'portrait' ? 'var(--accent-purple)' : 'var(--bg-card)',
                  border: `1px solid ${format === 'portrait' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                }}
              >
                竖屏 9:16 (TikTok/Shorts)
              </button>
              <button
                onClick={() => setFormat('landscape')}
                className="flex-1 py-3 rounded-full text-sm font-medium transition-all"
                style={{
                  background: format === 'landscape' ? 'var(--accent-purple)' : 'var(--bg-card)',
                  border: `1px solid ${format === 'landscape' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                }}
              >
                横屏 16:9 (YouTube)
              </button>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 rounded-xl text-white font-medium text-lg transition-all"
            style={{
              background: isGenerating
                ? 'var(--border-color)'
                : 'linear-gradient(135deg, #8b5cf6, #a855f7, #c084fc)',
            }}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成中...
              </span>
            ) : (
              <span>✨ 生成短视频 (Kie.ai Veo3.1)</span>
            )}
          </button>

          {/* Generated videos */}
          {generatedVideos.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <span className="text-green-400">✓</span>
                视频生成完成
              </h3>
              <div className="space-y-2">
                {generatedVideos.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <span className="text-sm">🎬 {v}</span>
                    <button className="text-xs px-3 py-1 rounded" style={{ background: 'var(--accent-blue)' }}>
                      下载
                    </button>
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

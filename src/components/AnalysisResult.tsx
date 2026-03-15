'use client';

import { useState } from 'react';
import { VideoAnalysis, TabType } from '@/lib/types';
import ShotsTab from './tabs/ShotsTab';
import StoryboardTab from './tabs/StoryboardTab';
import DeepAnalysisTab from './tabs/DeepAnalysisTab';
import StructureTab from './tabs/StructureTab';
import AIVideoTab from './tabs/AIVideoTab';
import ExportTab from './tabs/ExportTab';

interface Props {
  analysis: VideoAnalysis;
  onReset: () => void;
}

const tabs: { key: TabType; icon: string; label: string }[] = [
  { key: 'shots', icon: '📷', label: '镜头截图' },
  { key: 'storyboard', icon: '📋', label: '分镜脚本' },
  { key: 'deep-analysis', icon: '🧠', label: '深度分析' },
  { key: 'structure', icon: '📊', label: '脚本结构分析' },
  { key: 'ai-video', icon: '✨', label: 'AI 视频生成' },
  { key: 'export', icon: '📥', label: '导出报告' },
];

export default function AnalysisResult({ analysis, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('shots');

  const scoreColor = analysis.overallScore >= 80 ? '#22c55e' : analysis.overallScore >= 60 ? '#eab308' : '#ef4444';

  const metrics = [
    {
      value: `${analysis.firstProductAppearance}秒`,
      label: '产品首次出现',
      sub: '黄金3秒内出现最佳',
      color: 'var(--accent-orange)',
    },
    {
      value: `${analysis.productExposureDuration}秒`,
      label: '产品露出时长',
      sub: '建议占比30%以上',
      color: 'var(--accent-orange)',
    },
    {
      value: `${analysis.productExposurePercent}%`,
      label: '产品露出占比',
      sub: '高转化视频40%+',
      color: 'var(--accent-orange)',
    },
    {
      value: `${analysis.videoDuration}秒`,
      label: '视频总时长',
      sub: '短视频15-60秒最佳',
      color: 'var(--accent-orange)',
    },
    {
      value: `${analysis.shotCount}个`,
      label: '镜头数量',
      sub: '平均2-3秒/镜头',
      color: 'var(--accent-orange)',
    },
    {
      value: `${analysis.overallScore}分`,
      label: '综合评分',
      sub: analysis.overallScore >= 80 ? '优秀' : analysis.overallScore >= 60 ? '良好' : '有提升空间',
      color: scoreColor,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-blue)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm4 3l6 3-6 3V9z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold">爆款短视频拆解工具</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              分析报告 - {analysis.fileName}
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-sm px-4 py-2 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← 重新分析
        </button>
      </header>

      {/* Metrics */}
      <div className="px-6 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="metric-card">
            <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className="text-sm font-medium">{m.label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Optimization tip */}
      <div className="mx-6 mb-4 px-5 py-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)' }}>
        <span className="text-lg">💡</span>
        <span className="text-sm" style={{ color: '#eab308' }}>
          优化建议：{analysis.optimizationTip}
        </span>
      </div>

      {/* Title analysis summary bar */}
      {analysis.titleAnalysis?.title && (
        <div className="mx-6 mb-4 px-5 py-3 rounded-lg flex items-center gap-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <span className="text-lg">🎯</span>
          <div className="flex-1">
            <span className="text-sm font-medium">{analysis.titleAnalysis.title}</span>
            <div className="flex gap-2 mt-1">
              {analysis.titleAnalysis.keywords.slice(0, 5).map((kw, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
          {analysis.hookAnalysis?.hookType && (
            <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ background: '#ef4444' }}>
              🪝 {analysis.hookAnalysis.hookType}
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 flex gap-6 border-b overflow-x-auto" style={{ borderColor: 'var(--border-color)' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === tab.key ? 'tab-active' : ''
            }`}
            style={{ color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-6 py-6">
        {activeTab === 'shots' && <ShotsTab analysis={analysis} />}
        {activeTab === 'storyboard' && <StoryboardTab analysis={analysis} />}
        {activeTab === 'deep-analysis' && <DeepAnalysisTab analysis={analysis} />}
        {activeTab === 'structure' && <StructureTab analysis={analysis} />}
        {activeTab === 'ai-video' && <AIVideoTab analysis={analysis} />}
        {activeTab === 'export' && <ExportTab analysis={analysis} />}
      </div>
    </div>
  );
}

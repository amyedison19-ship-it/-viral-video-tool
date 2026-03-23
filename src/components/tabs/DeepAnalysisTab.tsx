'use client';

import { VideoAnalysis } from '@/lib/types';

interface Props {
  analysis: VideoAnalysis;
}

export default function DeepAnalysisTab({ analysis }: Props) {
  const { titleAnalysis, hookAnalysis, contentStructure, emotionCurve, scriptAnalysis, overallScore, strengths, weaknesses } = analysis;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-color)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#eab308' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={`${overallScore * 2.64} 264`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{overallScore}</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">综合评分</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {strengths.map((s, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                ✓ {s}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {weaknesses.map((w, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                ✗ {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Title Analysis */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(59,130,246,0.15)' }}>📝</span>
            标题分析
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>推测标题</p>
              <p className="text-sm font-medium">{titleAnalysis.title}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>关键词</p>
              <div className="flex flex-wrap gap-1.5">
                {titleAnalysis.keywords.map((kw, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-blue)' }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>情绪触发点</p>
              <p className="text-sm">{titleAnalysis.emotionalTrigger}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>目标受众</p>
              <p className="text-sm">{titleAnalysis.targetAudience}</p>
            </div>
          </div>
        </div>

        {/* Hook Analysis */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(239,68,68,0.15)' }}>🪝</span>
            开头钩子分析
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#ef4444' }}>
                {hookAnalysis.hookType}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                前 {hookAnalysis.hookDuration} 秒
              </span>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>钩子描述</p>
              <p className="text-sm">{hookAnalysis.hookDescription}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>效果评估</p>
              <p className="text-sm">{hookAnalysis.effectiveness}</p>
            </div>
          </div>
        </div>

        {/* Content Structure */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(168,85,247,0.15)' }}>🏗️</span>
            内容结构
          </h3>
          <div className="mb-3">
            <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'var(--accent-purple)' }}>
              {contentStructure.pattern}
            </span>
          </div>
          <div className="space-y-3">
            {contentStructure.phases.map((phase, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-purple)' }}>
                    {i + 1}
                  </div>
                  {i < contentStructure.phases.length - 1 && (
                    <div className="w-0.5 flex-1 mt-1" style={{ background: 'var(--border-color)' }} />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{phase.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {phase.startTime}s - {phase.endTime}s
                    </span>
                  </div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>目的: {phase.purpose}</p>
                  <p className="text-xs" style={{ color: 'var(--accent-blue)' }}>技巧: {phase.technique}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion Curve */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(236,72,153,0.15)' }}>💓</span>
            情绪曲线
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>整体走向</p>
              <p className="text-sm">{emotionCurve.overall}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>情绪节奏</p>
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(236,72,153,0.2)', color: '#ec4899' }}>
                {emotionCurve.rhythm}
              </span>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>情绪峰值</p>
              {/* Simple emotion timeline */}
              <div className="relative">
                <div className="h-1 rounded-full w-full" style={{ background: 'var(--border-color)' }} />
                <div className="flex justify-between mt-2">
                  {emotionCurve.peaks.map((peak, i) => {
                    const position = (peak.time / analysis.videoDuration) * 100;
                    return (
                      <div
                        key={i}
                        className="text-center"
                        style={{ position: 'absolute', left: `${Math.min(position, 90)}%`, transform: 'translateX(-50%)' }}
                      >
                        <div className="w-3 h-3 rounded-full -mt-2 mx-auto" style={{ background: '#ec4899' }} />
                        <p className="text-xs font-medium mt-1" style={{ color: '#ec4899' }}>{peak.emotion}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{peak.time}s</p>
                        <p className="text-[10px] max-w-[100px]" style={{ color: 'var(--text-secondary)' }}>{peak.trigger}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Script Analysis - Full Width */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(34,197,94,0.15)' }}>📜</span>
            文案脚本分析
          </h3>

          {scriptAnalysis.detectedLanguage && scriptAnalysis.detectedLanguage !== '中文' && (
            <div className="mb-4 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 text-xs" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)' }}>
              🌐 检测语言：{scriptAnalysis.detectedLanguage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Full script */}
            <div className="lg:col-span-2 space-y-3">
              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {scriptAnalysis.fullScriptChinese ? '原文口播文案' : '推测完整口播文案'}
                </p>
                <div className="p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--bg-secondary)' }}>
                  {scriptAnalysis.fullScript}
                </div>
              </div>
              {scriptAnalysis.fullScriptChinese && (
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--accent-blue)' }}>中文翻译</p>
                  <div className="p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    {scriptAnalysis.fullScriptChinese}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Metrics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>字数</span>
                <span className="text-sm font-medium">{scriptAnalysis.wordCount} 字</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>语速</span>
                <span className="text-sm font-medium">{scriptAnalysis.paceWordsPerSecond} 字/秒</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>文案风格</span>
                <span className="text-sm font-medium">{scriptAnalysis.toneStyle}</span>
              </div>

              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>关键金句</p>
                <div className="space-y-1.5">
                  {scriptAnalysis.keyPhrases.map((phrase, i) => (
                    <div key={i} className="text-xs p-2 rounded-lg flex items-start gap-1.5" style={{ background: 'var(--bg-secondary)' }}>
                      <span style={{ color: 'var(--accent-orange)' }}>★</span>
                      <span>{phrase}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>行动引导</p>
                <p className="text-sm p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)' }}>
                  {scriptAnalysis.callToAction}
                </p>
                {scriptAnalysis.callToActionChinese && (
                  <p className="text-xs mt-1 p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.05)', color: 'var(--text-secondary)' }}>
                    {scriptAnalysis.callToActionChinese}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

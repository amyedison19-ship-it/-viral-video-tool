'use client';

import { useState } from 'react';
import { VideoAnalysis, ShotType } from '@/lib/types';

const typeColors: Record<ShotType, string> = {
  '痛点放大': '#ef4444',
  '产品展示': '#f97316',
  '使用场景': '#eab308',
  '效果对比': '#22c55e',
  '行动引导': '#3b82f6',
};

interface Props {
  analysis: VideoAnalysis;
}

export default function ShotsTab({ analysis }: Props) {
  const [selectedShot, setSelectedShot] = useState<number | null>(null);

  const shotTypeCounts = analysis.shots.reduce((acc, shot) => {
    acc[shot.type] = (acc[shot.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const firstProductShot = analysis.shots.find(s => s.hasProduct);

  return (
    <div>
      {/* Title and play button row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎬</span>
          <h2 className="text-lg font-semibold">全部镜头（{analysis.shotCount}个分镜）</h2>
          <button className="ml-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>点击镜头可放大查看</span>
          {firstProductShot && (
            <span className="flex items-center gap-1">
              <span style={{ color: '#f97316' }}>⭐</span> 产品首现
            </span>
          )}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="timeline-bar mb-6">
        {analysis.shots.map((shot) => {
          const width = ((shot.endTime - shot.startTime) / analysis.videoDuration) * 100;
          return (
            <div
              key={shot.id}
              className="h-full flex items-center justify-center text-xs text-white font-medium cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                width: `${width}%`,
                backgroundColor: typeColors[shot.type],
                minWidth: '40px',
              }}
              title={`${shot.type} ${shot.startTime}-${shot.endTime}s`}
            >
              <span className="truncate px-1">
                {shot.type} {shot.startTime}-{shot.endTime}s
              </span>
            </div>
          );
        })}
      </div>

      {/* Shot cards grid */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        {analysis.shots.map((shot) => (
          <div
            key={shot.id}
            className="shot-card shrink-0"
            style={{ width: '140px' }}
            onClick={() => setSelectedShot(selectedShot === shot.id ? null : shot.id)}
          >
            {/* Shot number and time */}
            <div className="relative">
              <div
                className="w-full h-[180px] flex items-center justify-center"
                style={{ background: `hsl(${shot.id * 30}, 40%, 25%)` }}
              >
                <div className="text-center px-2">
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{shot.description.slice(0, 40)}...</p>
                </div>
              </div>
              {/* Shot number badge */}
              <div className="absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: typeColors[shot.type] }}>
                #{shot.id}
              </div>
              {/* Time badge */}
              <div className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.6)' }}>
                {shot.startTime}s
              </div>
              {/* Product first appearance */}
              {firstProductShot?.id === shot.id && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded whitespace-nowrap" style={{ background: '#f97316' }}>
                  ⭐ 产品首现
                </div>
              )}
              {/* TikTok icon */}
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <span className="text-[8px]">♪</span>
              </div>
            </div>
            {/* Type label */}
            <div className="px-2 py-2 text-center text-xs font-medium rounded-b" style={{ background: typeColors[shot.type] }}>
              {shot.type}
            </div>
          </div>
        ))}
      </div>

      {/* Shot type summary */}
      <div className="flex items-center justify-center gap-8 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
        {Object.entries(shotTypeCounts).map(([type, count]) => (
          <div key={type} className="text-center">
            <div className="text-2xl font-bold" style={{ color: typeColors[type as ShotType] }}>{count}</div>
            <div
              className="text-xs font-medium px-3 py-1 rounded mt-1"
              style={{ background: typeColors[type as ShotType] }}
            >
              {type}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded shot detail modal */}
      {selectedShot && (() => {
        const shot = analysis.shots.find(s => s.id === selectedShot);
        if (!shot) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setSelectedShot(null)}
          >
            <div
              className="max-w-lg w-full rounded-xl p-6"
              style={{ background: 'var(--bg-card)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs" style={{ background: typeColors[shot.type] }}>
                    #{shot.id} {shot.type}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {shot.startTime}s - {shot.endTime}s
                  </span>
                </h3>
                <button onClick={() => setSelectedShot(null)} className="text-xl">×</button>
              </div>
              <div className="mb-3">
                <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>画面描述</h4>
                <p className="text-sm">{shot.description}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>文案/口播</h4>
                <p className="text-sm">{shot.narration}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

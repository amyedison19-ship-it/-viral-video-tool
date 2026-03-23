'use client';

import { useState } from 'react';
import { VideoAnalysis } from '@/lib/types';
import { typeColors } from '@/lib/shot-colors';

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
                backgroundColor: typeColors[shot.type] || '#6b7280',
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
            style={{ width: '160px' }}
            onClick={() => setSelectedShot(selectedShot === shot.id ? null : shot.id)}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.thumbnailUrl}
                alt={`镜头 #${shot.id}`}
                className="w-full h-[200px] object-cover"
                style={{ background: `hsl(${shot.id * 30}, 40%, 25%)` }}
              />
              {/* Shot number badge */}
              <div className="absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: typeColors[shot.type] || '#6b7280' }}>
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
            </div>
            {/* Type label */}
            <div className="px-2 py-2 text-center text-xs font-medium rounded-b" style={{ background: typeColors[shot.type] || '#6b7280' }}>
              {shot.type}
            </div>
          </div>
        ))}
      </div>

      {/* Shot type summary */}
      <div className="flex items-center justify-center gap-8 mt-6 pt-6 flex-wrap" style={{ borderTop: '1px solid var(--border-color)' }}>
        {Object.entries(shotTypeCounts).map(([type, count]) => (
          <div key={type} className="text-center">
            <div className="text-2xl font-bold" style={{ color: typeColors[type as keyof typeof typeColors] || '#6b7280' }}>{count}</div>
            <div
              className="text-xs font-medium px-3 py-1 rounded mt-1"
              style={{ background: typeColors[type as keyof typeof typeColors] || '#6b7280' }}
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
              className="max-w-2xl w-full rounded-xl p-6"
              style={{ background: 'var(--bg-card)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs" style={{ background: typeColors[shot.type] || '#6b7280' }}>
                    #{shot.id} {shot.type}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {shot.startTime}s - {shot.endTime}s
                  </span>
                </h3>
                <button onClick={() => setSelectedShot(null)} className="text-xl">×</button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.thumbnailUrl}
                alt={`镜头 #${shot.id}`}
                className="w-full max-h-[300px] object-contain rounded-lg mb-4"
                style={{ background: 'var(--bg-secondary)' }}
              />
              <div className="mb-3">
                <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>画面描述</h4>
                <p className="text-sm">{shot.description}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>文案/口播</h4>
                <p className="text-sm">{shot.narration}</p>
                {shot.narrationChinese && (
                  <p className="text-sm mt-1" style={{ color: 'var(--accent-blue)' }}>{shot.narrationChinese}</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

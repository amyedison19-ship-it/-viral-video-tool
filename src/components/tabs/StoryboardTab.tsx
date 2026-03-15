'use client';

import { VideoAnalysis } from '@/lib/types';
import { typeColors } from '@/lib/shot-colors';

interface Props {
  analysis: VideoAnalysis;
}

export default function StoryboardTab({ analysis }: Props) {
  const handleCopyTable = () => {
    const header = '镜头\t时间\t类型\t画面描述\t文案/口播\t产品';
    const rows = analysis.shots.map(shot =>
      `#${shot.id}\t${shot.startTime}-${shot.endTime}s\t${shot.type}\t${shot.description}\t${shot.narration}\t${shot.hasProduct ? '是' : '否'}`
    );
    navigator.clipboard.writeText([header, ...rows].join('\n'));
    alert('表格已复制到剪贴板');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">分镜脚本表格</h2>
        <button
          onClick={handleCopyTable}
          className="text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          📋 复制表格
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="analysis-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>镜头</th>
                <th style={{ width: '180px' }}>时间</th>
                <th style={{ width: '80px' }}>类型</th>
                <th>画面描述</th>
                <th style={{ width: '120px' }}>镜头截图</th>
                <th>文案/口播</th>
                <th style={{ width: '50px' }}>产品</th>
              </tr>
            </thead>
            <tbody>
              {analysis.shots.map((shot) => (
                <tr key={shot.id}>
                  <td className="font-medium">#{shot.id}</td>
                  <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {shot.startTime}-{shot.endTime}s
                  </td>
                  <td>
                    <span
                      className="text-xs px-2 py-1 rounded whitespace-nowrap"
                      style={{ background: typeColors[shot.type] }}
                    >
                      {shot.type}
                    </span>
                  </td>
                  <td className="text-sm max-w-[300px]">{shot.description}</td>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shot.thumbnailUrl}
                      alt={`镜头 #${shot.id}`}
                      className="w-16 h-20 rounded object-cover"
                      style={{ background: `hsl(${shot.id * 30}, 40%, 25%)` }}
                    />
                  </td>
                  <td className="text-sm max-w-[300px]">{shot.narration}</td>
                  <td className="text-center">
                    {shot.hasProduct ? (
                      <span className="text-green-400 text-lg">✓</span>
                    ) : (
                      <span className="text-red-400 text-lg">×</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

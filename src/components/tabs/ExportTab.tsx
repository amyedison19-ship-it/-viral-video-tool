'use client';

import { VideoAnalysis } from '@/lib/types';

interface Props {
  analysis: VideoAnalysis;
}

export default function ExportTab({ analysis }: Props) {
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${analysis.fileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const header = '镜头,开始时间,结束时间,类型,画面描述,文案/口播,产品出现';
    const rows = analysis.shots.map(shot =>
      `${shot.id},${shot.startTime},${shot.endTime},${shot.type},"${shot.description}","${shot.narration}",${shot.hasProduct ? '是' : '否'}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard_${analysis.fileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    let md = `# 视频分析报告 - ${analysis.fileName}\n\n`;
    md += `## 关键指标\n\n`;
    md += `| 指标 | 数值 |\n|------|------|\n`;
    md += `| 产品首次出现 | ${analysis.firstProductAppearance}秒 |\n`;
    md += `| 产品露出时长 | ${analysis.productExposureDuration}秒 |\n`;
    md += `| 产品露出占比 | ${analysis.productExposurePercent}% |\n`;
    md += `| 视频总时长 | ${analysis.videoDuration}秒 |\n`;
    md += `| 镜头数量 | ${analysis.shotCount}个 |\n\n`;
    md += `## 优化建议\n\n${analysis.optimizationTip}\n\n`;
    md += `## 分镜脚本\n\n`;
    md += `| 镜头 | 时间 | 类型 | 画面描述 | 文案 |\n`;
    md += `|------|------|------|----------|------|\n`;
    analysis.shots.forEach(shot => {
      md += `| #${shot.id} | ${shot.startTime}-${shot.endTime}s | ${shot.type} | ${shot.description.slice(0, 50)}... | ${shot.narration.slice(0, 30)}... |\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${analysis.fileName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <span>📥</span> 导出报告
      </h2>

      <div className="space-y-4">
        {/* JSON Export */}
        <div
          className="rounded-xl p-6 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          onClick={handleExportJSON}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-medium">完整分析报告 (JSON)</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>包含所有分析数据，可用于二次开发</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent-blue)' }}>
            下载
          </button>
        </div>

        {/* CSV Export */}
        <div
          className="rounded-xl p-6 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          onClick={handleExportCSV}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="font-medium">分镜脚本表格 (CSV)</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>可直接导入 Excel/Google Sheets</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent-green)' }}>
            下载
          </button>
        </div>

        {/* Markdown Export */}
        <div
          className="rounded-xl p-6 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          onClick={handleExportMarkdown}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h3 className="font-medium">分析报告 (Markdown)</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>适合分享和文档记录</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent-purple)' }}>
            下载
          </button>
        </div>
      </div>

      {/* Report preview */}
      <div className="mt-8 rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="font-medium mb-4">报告预览</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>文件名</span>
            <span>{analysis.fileName}</span>
          </div>
          <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>视频时长</span>
            <span>{analysis.videoDuration}秒</span>
          </div>
          <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>镜头数量</span>
            <span>{analysis.shotCount}个</span>
          </div>
          <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>产品首现</span>
            <span>{analysis.firstProductAppearance}秒</span>
          </div>
          <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>产品露出</span>
            <span>{analysis.productExposureDuration}秒 ({analysis.productExposurePercent}%)</span>
          </div>
          <div className="flex justify-between py-2">
            <span style={{ color: 'var(--text-secondary)' }}>优化建议</span>
            <span className="text-right max-w-[300px]" style={{ color: '#eab308' }}>{analysis.optimizationTip}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

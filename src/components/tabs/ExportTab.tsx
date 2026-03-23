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
    // Generate HTML report with embedded thumbnails
    const shotsHtml = analysis.shots.map(shot => {
      const hasThumb = shot.thumbnailUrl && shot.thumbnailUrl.startsWith('data:');
      return `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold">#${shot.id}</td>
        <td style="padding:8px;border:1px solid #ddd;white-space:nowrap">${shot.startTime}-${shot.endTime}s</td>
        <td style="padding:8px;border:1px solid #ddd">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${
            shot.type === '产品展示' ? '#22c55e' :
            shot.type === '开头钩子' ? '#eab308' :
            shot.type === '使用场景' ? '#3b82f6' :
            shot.type === '痛点放大' ? '#ef4444' :
            shot.type === '效果对比' ? '#a855f7' :
            shot.type === '行动引导' ? '#f97316' :
            '#6b7280'
          };color:white;font-size:12px">${shot.type}</span>
        </td>
        <td style="padding:8px;border:1px solid #ddd;max-width:300px">${shot.description}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">
          ${hasThumb ? `<img src="${shot.thumbnailUrl}" style="width:120px;height:auto;border-radius:4px" />` : '<span style="color:#999">无截图</span>'}
        </td>
        <td style="padding:8px;border:1px solid #ddd;max-width:250px">${shot.narration || '-'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${shot.hasProduct ? '✓' : ''}</td>
      </tr>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>视频分析报告 - ${analysis.fileName}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; color: #333; }
  h1 { color: #1a1a2e; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
  h2 { color: #4338ca; margin-top: 30px; }
  .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 16px 0; }
  .metric { background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .metric-label { font-size: 13px; color: #666; }
  .metric-value { font-size: 20px; font-weight: bold; color: #1a1a2e; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th { background: #4338ca; color: white; padding: 10px 8px; text-align: left; font-size: 13px; }
  .tip { background: #fef3c7; border-left: 4px solid #eab308; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
  .product-info { background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 16px 0; }
</style>
</head>
<body>
<h1>视频分析报告</h1>
<p style="color:#666">文件名: ${analysis.fileName}</p>

<h2>关键指标</h2>
<div class="metrics">
  <div class="metric"><div class="metric-label">视频总时长</div><div class="metric-value">${analysis.videoDuration}秒</div></div>
  <div class="metric"><div class="metric-label">镜头数量</div><div class="metric-value">${analysis.shotCount}个</div></div>
  <div class="metric"><div class="metric-label">产品首次出现</div><div class="metric-value">${analysis.firstProductAppearance}秒</div></div>
  <div class="metric"><div class="metric-label">产品露出时长</div><div class="metric-value">${analysis.productExposureDuration}秒</div></div>
  <div class="metric"><div class="metric-label">产品露出占比</div><div class="metric-value">${analysis.productExposurePercent}%</div></div>
  <div class="metric"><div class="metric-label">综合评分</div><div class="metric-value">${analysis.overallScore}/100</div></div>
</div>

<div class="tip"><strong>优化建议：</strong>${analysis.optimizationTip}</div>

${analysis.productAppearance ? `
<h2>产品信息</h2>
<div class="product-info">
  <p><strong>产品名称：</strong>${analysis.productAppearance.name}</p>
  <p><strong>品牌：</strong>${analysis.productAppearance.brand}</p>
  <p><strong>品类：</strong>${analysis.productAppearance.category}</p>
  <p><strong>颜色：</strong>${analysis.productAppearance.color}</p>
  <p><strong>外观描述：</strong>${analysis.productAppearance.detailedDescription}</p>
  ${analysis.productAppearance.distinguishingFeatures.length > 0 ? `<p><strong>区分特征：</strong>${analysis.productAppearance.distinguishingFeatures.join('；')}</p>` : ''}
</div>` : ''}

<h2>分镜脚本</h2>
<table>
  <thead>
    <tr>
      <th style="width:50px">镜头</th>
      <th style="width:80px">时间</th>
      <th style="width:80px">类型</th>
      <th>画面描述</th>
      <th style="width:140px">镜头截图</th>
      <th>文案/口播</th>
      <th style="width:50px">产品</th>
    </tr>
  </thead>
  <tbody>
    ${shotsHtml}
  </tbody>
</table>

${analysis.titleAnalysis?.title ? `
<h2>标题分析</h2>
<div class="product-info">
  <p><strong>标题：</strong>${analysis.titleAnalysis.title}</p>
  <p><strong>关键词：</strong>${analysis.titleAnalysis.keywords.join('、')}</p>
  <p><strong>情绪触发：</strong>${analysis.titleAnalysis.emotionalTrigger}</p>
  <p><strong>目标受众：</strong>${analysis.titleAnalysis.targetAudience}</p>
</div>` : ''}

${analysis.hookAnalysis?.hookType ? `
<h2>钩子分析</h2>
<div class="product-info">
  <p><strong>钩子类型：</strong>${analysis.hookAnalysis.hookType}</p>
  <p><strong>描述：</strong>${analysis.hookAnalysis.hookDescription}</p>
  <p><strong>时长：</strong>${analysis.hookAnalysis.hookDuration}秒</p>
  <p><strong>效果评估：</strong>${analysis.hookAnalysis.effectiveness}</p>
</div>` : ''}

${analysis.scriptAnalysis?.fullScript ? `
<h2>完整文案</h2>
<div class="product-info">
  <p>${analysis.scriptAnalysis.fullScript}</p>
  <p style="margin-top:8px;color:#666;font-size:13px">字数: ${analysis.scriptAnalysis.wordCount} | 语速: ${analysis.scriptAnalysis.paceWordsPerSecond}字/秒 | 风格: ${analysis.scriptAnalysis.toneStyle}</p>
</div>` : ''}

<p style="text-align:center;color:#999;margin-top:40px;font-size:12px">报告由 爆款短视频拆解工具 生成 | ${new Date().toLocaleDateString('zh-CN')}</p>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${analysis.fileName}.html`;
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
              <h3 className="font-medium">分析报告 (HTML 含截图)</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>包含镜头截图，适合分享和文档记录</p>
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

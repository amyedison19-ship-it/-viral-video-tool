'use client';

import { useState } from 'react';
import { VideoAnalysis } from '@/lib/types';

interface Props {
  analysis: VideoAnalysis;
}

export default function ExportTab({ analysis }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);

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
    const header = '镜头,开始时间,结束时间,类型,画面描述,文案/口播,中文翻译,产品出现';
    const rows = analysis.shots.map(shot =>
      `${shot.id},${shot.startTime},${shot.endTime},${shot.type},"${shot.description}","${shot.narration}","${shot.narrationChinese || ''}",${shot.hasProduct ? '是' : '否'}`
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

  const buildReportHtml = (forPdf = false) => {
    const shotTypeColor = (type: string) => {
      switch (type) {
        case '产品展示': return '#22c55e';
        case '开头钩子': return '#eab308';
        case '使用场景': return '#3b82f6';
        case '痛点放大': return '#ef4444';
        case '效果对比': return '#a855f7';
        case '行动引导': return '#f97316';
        default: return '#6b7280';
      }
    };

    // For PDF: each shot is a separate card instead of a table row
    // This avoids complex table layout issues in PDF rendering
    const shotsContent = forPdf
      ? analysis.shots.map(shot => {
          const hasThumb = shot.thumbnailUrl?.startsWith('data:');
          return `
          <div style="border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:10px;page-break-inside:avoid;break-inside:avoid;display:flex;gap:12px;align-items:flex-start">
            ${hasThumb ? `<img src="${shot.thumbnailUrl}" style="width:160px;height:auto;border-radius:4px;flex-shrink:0" />` : ''}
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <strong>#${shot.id}</strong>
                <span style="font-size:12px;color:#666">${shot.startTime}-${shot.endTime}s</span>
                <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${shotTypeColor(shot.type)};color:white;font-size:11px">${shot.type}</span>
                ${shot.hasProduct ? '<span style="color:#22c55e;font-size:12px">✓ 产品</span>' : ''}
              </div>
              <p style="margin:4px 0;font-size:13px;color:#333">${shot.description}</p>
              ${shot.narration ? `<p style="margin:4px 0;font-size:12px;color:#555">${shot.narration}</p>` : ''}
              ${shot.narrationChinese ? `<p style="margin:2px 0;font-size:12px;color:#3b82f6">${shot.narrationChinese}</p>` : ''}
            </div>
          </div>`;
        }).join('\n')
      : (() => {
          const rows = analysis.shots.map(shot => {
            const hasThumb = shot.thumbnailUrl?.startsWith('data:');
            return `
            <tr>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold">#${shot.id}</td>
              <td style="padding:8px;border:1px solid #ddd;white-space:nowrap">${shot.startTime}-${shot.endTime}s</td>
              <td style="padding:8px;border:1px solid #ddd">
                <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${shotTypeColor(shot.type)};color:white;font-size:12px">${shot.type}</span>
              </td>
              <td style="padding:8px;border:1px solid #ddd;max-width:300px">${shot.description}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center">
                ${hasThumb ? `<img src="${shot.thumbnailUrl}" style="width:120px;height:auto;border-radius:4px" />` : '<span style="color:#999">无截图</span>'}
              </td>
              <td style="padding:8px;border:1px solid #ddd;max-width:250px">${shot.narration || '-'}${shot.narrationChinese ? `<br/><span style="color:#3b82f6;font-size:12px">${shot.narrationChinese}</span>` : ''}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center">${shot.hasProduct ? '✓' : ''}</td>
            </tr>`;
          }).join('\n');
          return `<table>
            <thead><tr>
              <th style="width:50px">镜头</th>
              <th style="width:80px">时间</th>
              <th style="width:80px">类型</th>
              <th>画面描述</th>
              <th style="width:140px">镜头截图</th>
              <th>文案/口播</th>
              <th style="width:50px">产品</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>`;
        })();

    const scriptSection = analysis.scriptAnalysis?.fullScript ? `
<h2>完整文案${analysis.scriptAnalysis.detectedLanguage && analysis.scriptAnalysis.detectedLanguage !== '中文' ? ` (${analysis.scriptAnalysis.detectedLanguage})` : ''}</h2>
<div class="info-block">
  <p>${analysis.scriptAnalysis.fullScript}</p>
  ${analysis.scriptAnalysis.fullScriptChinese ? `<p style="margin-top:12px;padding-top:12px;border-top:1px solid #eee;color:#3b82f6"><strong>中文翻译：</strong>${analysis.scriptAnalysis.fullScriptChinese}</p>` : ''}
  ${analysis.scriptAnalysis.callToAction ? `<p style="margin-top:12px;padding-top:12px;border-top:1px solid #eee"><strong>行动引导：</strong>${analysis.scriptAnalysis.callToAction}${analysis.scriptAnalysis.callToActionChinese ? `<br/><span style="color:#3b82f6">${analysis.scriptAnalysis.callToActionChinese}</span>` : ''}</p>` : ''}
  <p style="margin-top:8px;color:#666;font-size:13px">字数: ${analysis.scriptAnalysis.wordCount} | 语速: ${analysis.scriptAnalysis.paceWordsPerSecond}字/秒 | 风格: ${analysis.scriptAnalysis.toneStyle}</p>
</div>` : '';

    const strengthsSection = (analysis.strengths?.length > 0 || analysis.weaknesses?.length > 0) ? `
<h2>优劣势分析</h2>
<div class="info-block">
  ${analysis.strengths?.map(s => `<p style="color:#16a34a"><strong>✓</strong> ${s}</p>`).join('') || ''}
  ${analysis.weaknesses?.map(w => `<p style="color:#dc2626"><strong>✗</strong> ${w}</p>`).join('') || ''}
</div>` : '';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>视频分析报告 - ${analysis.fileName}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #fff; color: #333; }
  h1 { color: #1a1a2e; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
  h2 { color: #4338ca; margin-top: 30px; page-break-after: avoid; }
  .metrics { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0; }
  .metric { background: #f8f9fa; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; flex: 1; min-width: 150px; }
  .metric-label { font-size: 13px; color: #666; }
  .metric-value { font-size: 20px; font-weight: bold; color: #1a1a2e; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; background: white; }
  th { background: #4338ca; color: white; padding: 10px 8px; text-align: left; font-size: 13px; }
  .tip { background: #fef3c7; border-left: 4px solid #eab308; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
  .info-block { background: #f8f9fa; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0; page-break-inside: avoid; }
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
<div class="info-block">
  <p><strong>产品名称：</strong>${analysis.productAppearance.name}</p>
  <p><strong>品牌：</strong>${analysis.productAppearance.brand}</p>
  <p><strong>品类：</strong>${analysis.productAppearance.category}</p>
  <p><strong>颜色：</strong>${analysis.productAppearance.color}</p>
  <p><strong>外观描述：</strong>${analysis.productAppearance.detailedDescription}</p>
  ${analysis.productAppearance.distinguishingFeatures.length > 0 ? `<p><strong>区分特征：</strong>${analysis.productAppearance.distinguishingFeatures.join('；')}</p>` : ''}
</div>` : ''}

<h2>分镜脚本</h2>
${shotsContent}

${analysis.titleAnalysis?.title ? `
<h2>标题分析</h2>
<div class="info-block">
  <p><strong>标题：</strong>${analysis.titleAnalysis.title}</p>
  <p><strong>关键词：</strong>${analysis.titleAnalysis.keywords.join('、')}</p>
  <p><strong>情绪触发：</strong>${analysis.titleAnalysis.emotionalTrigger}</p>
  <p><strong>目标受众：</strong>${analysis.titleAnalysis.targetAudience}</p>
</div>` : ''}

${analysis.hookAnalysis?.hookType ? `
<h2>钩子分析</h2>
<div class="info-block">
  <p><strong>钩子类型：</strong>${analysis.hookAnalysis.hookType}</p>
  <p><strong>描述：</strong>${analysis.hookAnalysis.hookDescription}</p>
  <p><strong>时长：</strong>${analysis.hookAnalysis.hookDuration}秒</p>
  <p><strong>效果评估：</strong>${analysis.hookAnalysis.effectiveness}</p>
</div>` : ''}

${scriptSection}

${strengthsSection}

<p style="text-align:center;color:#999;margin-top:40px;font-size:12px">报告由 爆款短视频拆解工具 生成 | ${new Date().toLocaleDateString('zh-CN')}</p>
</body>
</html>`;
  };

  const handleExportHTML = () => {
    const html = buildReportHtml(false);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${analysis.fileName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;

      // Build PDF-optimized HTML (card layout instead of table)
      const htmlStr = buildReportHtml(true);
      const parser = new DOMParser();
      const parsed = parser.parseFromString(htmlStr, 'text/html');

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'width:1009px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","PingFang SC",sans-serif;color:#333;padding:20px;background:white;';

      // Copy styles from parsed document
      const styles = parsed.querySelectorAll('style');
      styles.forEach(s => wrapper.appendChild(s.cloneNode(true)));
      // Copy body content
      wrapper.innerHTML += parsed.body.innerHTML;

      document.body.appendChild(wrapper);

      await html2pdf()
        .set({
          margin: [8, 8, 12, 8],
          filename: `report_${analysis.fileName}.pdf`,
          image: { type: 'jpeg', quality: 0.92 },
          html2canvas: { scale: 2, useCORS: true, logging: false, width: 1009 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        } as Record<string, unknown>)
        .from(wrapper)
        .save();

      document.body.removeChild(wrapper);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF 导出失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPdfLoading(false);
    }
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

        {/* HTML Export */}
        <div
          className="rounded-xl p-6 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          onClick={handleExportHTML}
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

        {/* PDF Export */}
        <div
          className="rounded-xl p-6 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          onClick={!pdfLoading ? handleExportPDF : undefined}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h3 className="font-medium">分析报告 (PDF 含截图)</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>横版 PDF，包含镜头截图，适合打印和存档</p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: pdfLoading ? '#666' : '#ef4444' }}
            disabled={pdfLoading}
          >
            {pdfLoading ? '生成中...' : '下载'}
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

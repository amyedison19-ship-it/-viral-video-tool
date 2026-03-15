'use client';

import { useState, useRef, useCallback } from 'react';
import AnalysisResult from '@/components/AnalysisResult';
import { VideoAnalysis } from '@/lib/types';
import { generateMockAnalysis } from '@/lib/mock-data';

export default function Home() {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('请选择视频文件');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      alert('文件大小不能超过100MB');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    clearInterval(interval);
    setProgress(100);

    const result = generateMockAnalysis(file.name);
    await new Promise(resolve => setTimeout(resolve, 500));

    setAnalysis(result);
    setIsAnalyzing(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleReset = useCallback(() => {
    setAnalysis(null);
    setProgress(0);
  }, []);

  if (analysis) {
    return <AnalysisResult analysis={analysis} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-3" style={{ background: 'var(--bg-secondary)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-blue)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm4 3l6 3-6 3V9z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold">爆款短视频拆解工具</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>AI驱动的视频结构分析</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Upload area */}
        <div
          className={`upload-area w-full max-w-2xl rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer ${dragOver ? 'dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          {isAnalyzing ? (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg">正在分析视频...</p>
              <div className="w-full max-w-md rounded-full h-2" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'var(--accent-blue)' }}
                />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{Math.round(progress)}%</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-card)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
              </div>
              <p className="text-lg mb-2">拖拽视频到这里，或点击上传</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                支持 MP4, MOV, AVI, WebM 格式，最大 100MB
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/mov,video/avi,video/webm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 w-full max-w-2xl">
          <div className="feature-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent-blue)">
                <circle cx="12" cy="12" r="10"/><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">智能镜头拆解</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>自动识别场景切换，提取关键帧截图</p>
            </div>
          </div>

          <div className="feature-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent-green)">
                <path d="M3 3v18h18M7 16l4-4 4 4 6-6"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">数据指标分析</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>产品露出时长、首现时间等关键指标</p>
            </div>
          </div>

          <div className="feature-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent-purple)">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="white" strokeWidth="1"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">分镜脚本生成</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>生成完整分镜表格，一键导出</p>
            </div>
          </div>

          <div className="feature-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent-orange)">
                <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">跨品类改编</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>智能改编脚本，适配不同产品</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

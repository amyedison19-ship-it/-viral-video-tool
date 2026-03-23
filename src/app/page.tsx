'use client';

import { useState, useRef, useCallback } from 'react';
import AnalysisResult from '@/components/AnalysisResult';
import { VideoAnalysis } from '@/lib/types';

export default function Home() {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract video metadata using HTML5 video element
  const getVideoMetadata = useCallback((file: File): Promise<{ duration: number; width: number; height: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration || 0,
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
        });
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        resolve({ duration: 0, width: 0, height: 0 });
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Capture a single frame from video at a given time
  const captureFrame = useCallback((videoEl: HTMLVideoElement, time: number): Promise<string> => {
    return new Promise((resolve) => {
      videoEl.currentTime = time;
      videoEl.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve('');
        }
      };
    });
  }, []);

  // Capture frames for all shots from video file
  const captureAllFrames = useCallback(async (file: File, shots: VideoAnalysis['shots']): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;
      video.onloadeddata = async () => {
        const frames: string[] = [];
        for (const shot of shots) {
          try {
            const frame = await captureFrame(video, shot.startTime);
            frames.push(frame);
          } catch {
            frames.push('');
          }
        }
        URL.revokeObjectURL(url);
        resolve(frames);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(shots.map(() => ''));
      };
    });
  }, [captureFrame]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('请选择视频文件');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      alert('文件大小不能超过 100MB');
      return;
    }

    setLastFile(file);
    setIsAnalyzing(true);
    setProgress(0);
    setErrorMsg('');
    setStatusText('正在读取视频信息...');

    let step = '读取视频信息';
    try {
      // Step 0: Get video metadata from browser
      const metadata = await getVideoMetadata(file);
      setProgress(5);

      // Step 1: Init resumable upload (small JSON, no size limit issues)
      step = '初始化上传';
      setStatusText('正在初始化上传...');
      let initRes: Response;
      try {
        initRes = await fetch('/api/init-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'video/mp4',
          }),
        });
      } catch (fetchErr) {
        throw new Error(`初始化上传请求失败: ${fetchErr instanceof Error ? fetchErr.message : '网络错误'}`);
      }

      if (!initRes.ok) {
        const ct = initRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const initData = await initRes.json();
          throw new Error(initData.error || `初始化上传失败 (${initRes.status})`);
        } else {
          const text = await initRes.text();
          console.error('init-upload non-JSON:', initRes.status, text.slice(0, 300));
          throw new Error(`初始化上传失败 (${initRes.status})，服务端返回非JSON`);
        }
      }

      const { uploadUrl } = await initRes.json();
      if (!uploadUrl) throw new Error('未获取到上传地址');

      setProgress(10);

      // Step 2: Upload video - try direct browser upload first, fall back to server proxy
      step = '上传视频';
      setStatusText('正在上传视频...');
      setProgress(20);

      let uploadData: Record<string, unknown> | null = null;
      let directUploadAttempted = false;

      // Try direct browser upload (bypasses Vercel 4.5MB body limit)
      try {
        directUploadAttempted = true;
        const directRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Length': String(file.size),
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize',
          },
          body: file,
        });
        if (directRes.ok) {
          uploadData = await directRes.json();
          console.log('Direct upload to Gemini succeeded');
        } else {
          console.warn('Direct upload returned non-ok:', directRes.status);
        }
      } catch (directErr) {
        console.warn('Direct upload error (likely CORS):', directErr);
      }

      // Fallback: proxy through server
      // If direct upload was attempted, we need a FRESH upload URL (the old one is consumed)
      if (!uploadData) {
        let proxyUploadUrl = uploadUrl;

        if (directUploadAttempted) {
          // Get a fresh upload URL since the previous one may have been consumed
          setStatusText('正在重新初始化上传...');
          const freshInitRes = await fetch('/api/init-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || 'video/mp4',
            }),
          });

          if (!freshInitRes.ok) {
            throw new Error('重新初始化上传失败');
          }

          const freshData = await freshInitRes.json();
          proxyUploadUrl = freshData.uploadUrl;
          if (!proxyUploadUrl) throw new Error('未获取到新的上传地址');
        }

        setStatusText('正在通过服务端上传视频...');

        // Single chunk through proxy (works for files within Vercel body limit)
        const uploadRes = await fetch('/api/upload-chunk', {
          method: 'POST',
          headers: {
            'x-upload-url': proxyUploadUrl,
            'x-upload-offset': '0',
            'x-upload-command': 'upload, finalize',
          },
          body: file,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({ error: `上传失败 (${uploadRes.status})` }));
          throw new Error(errData.error || `视频上传失败 (${uploadRes.status})`);
        }

        uploadData = await uploadRes.json();
      }

      const fileUri = (uploadData as Record<string, Record<string, string>>)?.file?.uri;
      if (!fileUri) {
        throw new Error('上传成功但未获取到文件 URI');
      }

      setProgress(50);

      // Step 3: Call analyze API with file URI (small JSON body)
      step = 'AI分析';
      setStatusText('Gemini AI 正在分析视频内容...');

      // Animate progress during analysis
      let currentProgress = 50;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 3;
        if (currentProgress > 90) currentProgress = 90;
        setProgress(currentProgress);
      }, 500);

      let analyzeRes: Response;
      try {
        analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUri,
            mimeType: file.type || 'video/mp4',
            fileName: file.name,
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height,
          }),
        });
      } catch (fetchErr) {
        clearInterval(interval);
        throw new Error(`分析请求失败: ${fetchErr instanceof Error ? fetchErr.message : '网络错误'}`);
      }

      clearInterval(interval);

      const contentType = analyzeRes.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await analyzeRes.text();
        console.error('Non-JSON response:', analyzeRes.status, text.slice(0, 200));
        throw new Error(`分析接口返回非JSON (${analyzeRes.status})，请检查环境变量配置`);
      }

      const data = await analyzeRes.json();

      if (!analyzeRes.ok) {
        throw new Error(data.error || '分析失败，请重试');
      }

      setProgress(92);
      setStatusText('正在截取视频帧...');

      const result: VideoAnalysis = data;

      // Capture frames from video for each shot
      const frames = await captureAllFrames(file, result.shots);
      result.shots = result.shots.map((shot, i) => ({
        ...shot,
        thumbnailUrl: frames[i] || shot.thumbnailUrl,
      }));

      setProgress(100);
      setStatusText('正在生成分析报告...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setAnalysis(result);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '分析失败，请重试';
      setErrorMsg(`[${step}] ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [getVideoMetadata, captureAllFrames]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleReset = useCallback(() => {
    setAnalysis(null);
    setProgress(0);
    setErrorMsg('');
    setStatusText('');
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
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>AI驱动的视频结构分析 · Powered by Gemini</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Upload area */}
        <div
          className={`upload-area w-full max-w-2xl rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer ${dragOver ? 'dragover' : ''}`}
          onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          {isAnalyzing ? (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg">{statusText || '正在分析视频...'}</p>
              <div className="w-full max-w-md rounded-full h-2" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'var(--accent-blue)' }}
                />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {Math.round(progress)}% · Gemini AI 正在分析视频内容...
              </p>
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
              // Reset input so same file can be re-selected
              e.target.value = '';
            }}
          />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 px-5 py-3 rounded-lg w-full max-w-2xl" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="text-sm flex-1" style={{ color: '#ef4444' }}>{errorMsg}</span>
              <button
                onClick={() => setErrorMsg('')}
                className="text-sm px-3 py-1 rounded"
                style={{ color: 'var(--text-secondary)' }}
              >
                关闭
              </button>
            </div>
            {lastFile && (
              <button
                onClick={() => { setErrorMsg(''); handleFileSelect(lastFile); }}
                className="mt-2 text-sm px-4 py-1.5 rounded-lg font-medium text-white"
                style={{ background: 'var(--accent-blue)' }}
              >
                重新分析
              </button>
            )}
          </div>
        )}

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
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gemini AI 自动识别场景，提取关键帧截图</p>
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
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>标题分析、钩子拆解、情绪曲线等深度指标</p>
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
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gemini AI 生成完整分镜表格，一键导出</p>
            </div>
          </div>

          <div className="feature-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent-blue)">
                <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">同品复刻</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>同款产品换场景拍摄，快速复刻爆款</p>
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

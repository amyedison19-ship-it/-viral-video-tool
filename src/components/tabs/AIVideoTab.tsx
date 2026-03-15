'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { VideoAnalysis, SameProductScript, CrossCategoryScript } from '@/lib/types';
import { generateMockCrossCategoryScript, generateVideoPrompt, convertSameProductToVideoScript } from '@/lib/mock-data';
import { typeColors } from '@/lib/shot-colors';

interface GeneratedVideo {
  taskId: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  videoUrl?: string;
  error?: string;
  elapsed: number;
}

interface Props {
  analysis: VideoAnalysis;
  latestSameProductScript?: SameProductScript | null;
}

export default function AIVideoTab({ analysis, latestSameProductScript }: Props) {
  const [model, setModel] = useState<'fast' | 'quality'>('fast');
  const [format, setFormat] = useState<'portrait' | 'landscape'>('portrait');
  const [duration, setDuration] = useState(5);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [arkConfigured, setArkConfigured] = useState(true);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedRefImages, setSelectedRefImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Auto-select product shot frame as reference image
  const productShots = useMemo(() => {
    return analysis.shots.filter(s => s.hasProduct && s.thumbnailUrl && s.thumbnailUrl.startsWith('data:'));
  }, [analysis.shots]);

  // Auto-select the first product shot as default reference
  useEffect(() => {
    if (productShots.length > 0 && selectedRefImages.length === 0 && uploadedImages.length === 0) {
      setSelectedRefImages([productShots[0].thumbnailUrl]);
    }
  }, [productShots, selectedRefImages.length, uploadedImages.length]);

  // Handle local image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setUploadedImages(prev => [...prev, dataUrl]);
        setSelectedRefImages(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const toggleRefImage = useCallback((img: string) => {
    setSelectedRefImages(prev =>
      prev.includes(img) ? prev.filter(i => i !== img) : [...prev, img]
    );
  }, []);

  const removeUploadedImage = useCallback((img: string) => {
    setUploadedImages(prev => prev.filter(i => i !== img));
    setSelectedRefImages(prev => prev.filter(i => i !== img));
  }, []);

  // Check API key configuration on mount
  useEffect(() => {
    fetch('/api/check-config')
      .then(res => res.json())
      .then(data => setArkConfigured(!!data.ark))
      .catch(() => {});
  }, []);

  const productName = analysis.titleAnalysis?.title || analysis.fileName || '产品';

  const currentScript: CrossCategoryScript = useMemo(() => {
    if (latestSameProductScript) {
      return convertSameProductToVideoScript(latestSameProductScript, productName);
    }
    return generateMockCrossCategoryScript(productName);
  }, [latestSameProductScript, productName]);

  const [prompt, setPrompt] = useState(generateVideoPrompt(currentScript, analysis.productAppearance));

  useEffect(() => {
    setPrompt(generateVideoPrompt(currentScript, analysis.productAppearance));
  }, [currentScript, analysis.productAppearance]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const pollTaskStatus = useCallback((taskId: string) => {
    const startTime = Date.now();

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-task?id=${taskId}`);
        const data = await res.json();

        if (!res.ok) {
          setGeneratedVideos(prev => prev.map(v =>
            v.taskId === taskId ? { ...v, status: 'failed', error: data.error || '查询失败' } : v
          ));
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          return;
        }

        const elapsed = Math.round((Date.now() - startTime) / 1000);

        // Handle ARK API response format
        const status = data.status || data.task_status;
        if (status === 'succeeded' || status === 'done' || status === 'completed') {
          // Use server-extracted URL first, then try client-side extraction as fallback
          const videoUrl = data._extractedVideoUrl
            || data.video?.url
            || data.content?.[0]?.video_url?.url
            || data.content?.[0]?.url
            || data.output?.video_url
            || data.video_url
            || '';

          console.log('Video generation done. Full API response:', JSON.stringify(data, null, 2));
          console.log('Extracted video URL:', videoUrl);

          setGeneratedVideos(prev => prev.map(v =>
            v.taskId === taskId ? { ...v, status: 'done', videoUrl, elapsed } : v
          ));
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        } else if (status === 'failed' || status === 'error') {
          setGeneratedVideos(prev => prev.map(v =>
            v.taskId === taskId ? { ...v, status: 'failed', error: data.error?.message || '生成失败', elapsed } : v
          ));
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        } else {
          // Still processing
          setGeneratedVideos(prev => prev.map(v =>
            v.taskId === taskId ? { ...v, status: 'processing', elapsed } : v
          ));
        }
      } catch {
        // Network error, keep polling
      }
    }, 5000);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg('');

    const aspectRatio = format === 'portrait' ? '9:16' : '16:9';

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          aspectRatio,
          duration,
          referenceImageUrls: selectedRefImages.length > 0 ? selectedRefImages : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || '请求失败');
        setIsGenerating(false);
        return;
      }

      // Extract task ID from response
      const taskId = data.id || data.task_id;
      if (!taskId) {
        setErrorMsg('未获取到任务 ID，请检查 API 配置');
        setIsGenerating(false);
        return;
      }

      const newVideo: GeneratedVideo = {
        taskId,
        status: 'pending',
        elapsed: 0,
      };

      setGeneratedVideos(prev => [newVideo, ...prev]);
      pollTaskStatus(taskId);
    } catch (err) {
      setErrorMsg(`请求异常: ${String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>✨</span> AI 生成短视频
        </h2>
        <span className="text-xs px-3 py-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
          Powered by Seedance | 即梦 AI 视频生成
        </span>
      </div>

      {/* Adapted script display */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-400">✓</span>
          <span className="font-medium">
            {latestSameProductScript
              ? `已更新脚本：${latestSameProductScript.scenarioName}场景 - ${currentScript.productName}`
              : `已改编脚本：${currentScript.productName}`}
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {currentScript.scenes.map((scene, i) => (
            <div key={i} className="shrink-0 w-[420px] rounded-lg p-3" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: typeColors[scene.type] }}>
                  {scene.type}
                </span>
              </div>
              <p className="text-sm mb-2">{scene.englishDescription}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {scene.chineseDescription}
              </p>
              <div className="mt-2 w-full h-1 rounded-full" style={{ background: 'var(--border-color)' }}>
                <div className="h-full rounded-full" style={{ width: '60%', background: 'var(--accent-blue)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Video prompt editor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">视频生成提示词</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm px-3 py-1 rounded transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--accent-blue)' }}
            >
              {isEditing ? '完成编辑' : '编辑提示词'}
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            readOnly={!isEditing}
            className="w-full h-[400px] p-4 rounded-xl text-sm leading-relaxed font-mono outline-none resize-none"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isEditing ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Right: Generation settings */}
        <div className="space-y-6">
          {/* Model selection */}
          <div>
            <h3 className="font-medium mb-3">选择模型</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModel('fast')}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: `2px solid ${model === 'fast' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 ${model === 'fast' ? 'border-purple-500' : 'border-gray-500'}`}>
                    {model === 'fast' && <div className="w-2 h-2 rounded-full m-0.5" style={{ background: 'var(--accent-purple)' }} />}
                  </div>
                  <span className="font-medium text-sm">Seedance Lite</span>
                </div>
                <p className="text-xs ml-6" style={{ color: 'var(--text-secondary)' }}>即梦轻量版（快速）</p>
                <span className="inline-block mt-1 ml-6 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>推荐</span>
                <p className="text-xs ml-6 mt-1" style={{ color: 'var(--text-secondary)' }}>生成速度快，质量好</p>
              </button>
              <button
                onClick={() => setModel('quality')}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: `2px solid ${model === 'quality' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 ${model === 'quality' ? 'border-purple-500' : 'border-gray-500'}`}>
                    {model === 'quality' && <div className="w-2 h-2 rounded-full m-0.5" style={{ background: 'var(--accent-purple)' }} />}
                  </div>
                  <span className="font-medium text-sm">Seedance Pro</span>
                </div>
                <p className="text-xs ml-6" style={{ color: 'var(--text-secondary)' }}>即梦专业版（高质量）</p>
                <p className="text-xs ml-6 mt-1" style={{ color: 'var(--text-secondary)' }}>1080P 高清，多镜头叙事</p>
              </button>
            </div>
          </div>

          {/* Duration selection */}
          <div>
            <h3 className="font-medium mb-3">视频时长: {duration} 秒</h3>
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              <span>2秒</span>
              <span>12秒</span>
            </div>
          </div>

          {/* Format selection */}
          <div>
            <h3 className="font-medium mb-3">视频格式</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat('portrait')}
                className="flex-1 py-3 rounded-full text-sm font-medium transition-all"
                style={{
                  background: format === 'portrait' ? 'var(--accent-purple)' : 'var(--bg-card)',
                  border: `1px solid ${format === 'portrait' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                }}
              >
                竖屏 9:16 (TikTok/Shorts)
              </button>
              <button
                onClick={() => setFormat('landscape')}
                className="flex-1 py-3 rounded-full text-sm font-medium transition-all"
                style={{
                  background: format === 'landscape' ? 'var(--accent-purple)' : 'var(--bg-card)',
                  border: `1px solid ${format === 'landscape' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                }}
              >
                横屏 16:9 (YouTube)
              </button>
            </div>
          </div>

          {/* Reference images for i2v mode */}
          <div>
            <h3 className="font-medium mb-2">产品参考图（图生视频模式）</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              选择原视频截图或上传产品原图作为参考（可多选），AI 将基于参考图保持产品外观一致
            </p>

            {/* Video frame shots */}
            {productShots.length > 0 && (
              <>
                <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>原视频截图：</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {productShots.map((shot, i) => (
                    <button
                      key={shot.id}
                      onClick={() => toggleRefImage(shot.thumbnailUrl)}
                      className="relative rounded-lg overflow-hidden transition-all"
                      style={{
                        border: `3px solid ${selectedRefImages.includes(shot.thumbnailUrl) ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                        opacity: selectedRefImages.includes(shot.thumbnailUrl) ? 1 : 0.6,
                      }}
                    >
                      <img
                        src={shot.thumbnailUrl}
                        alt={`产品镜头 ${i + 1}`}
                        className="w-20 h-20 object-cover"
                      />
                      {selectedRefImages.includes(shot.thumbnailUrl) && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.3)' }}>
                          <span className="text-white text-lg">&#10003;</span>
                        </div>
                      )}
                      <span className="absolute bottom-0 left-0 right-0 text-center text-xs py-0.5" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                        {shot.type}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Uploaded images */}
            {uploadedImages.length > 0 && (
              <>
                <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>已上传的产品图：</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative">
                      <button
                        onClick={() => toggleRefImage(img)}
                        className="relative rounded-lg overflow-hidden transition-all"
                        style={{
                          border: `3px solid ${selectedRefImages.includes(img) ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                          opacity: selectedRefImages.includes(img) ? 1 : 0.6,
                        }}
                      >
                        <img
                          src={img}
                          alt={`上传图片 ${i + 1}`}
                          className="w-20 h-20 object-cover"
                        />
                        {selectedRefImages.includes(img) && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.3)' }}>
                            <span className="text-white text-lg">&#10003;</span>
                          </div>
                        )}
                        <span className="absolute bottom-0 left-0 right-0 text-center text-xs py-0.5" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                          上传
                        </span>
                      </button>
                      <button
                        onClick={() => removeUploadedImage(img)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                        style={{ background: '#ef4444' }}
                      >
                        &#10005;
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Upload button */}
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => uploadInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--accent-purple)', color: 'var(--accent-purple)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              上传产品原图（可多张）
            </button>

            {/* Status indicator */}
            {selectedRefImages.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                <span className="text-xs" style={{ color: '#22c55e' }}>
                  已选择 {selectedRefImages.length} 张参考图 — 图生视频模式已启用
                </span>
              </div>
            )}
          </div>

          {/* Audio notice */}
          <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <span style={{ color: '#3b82f6' }}>&#9432;</span>
            <span className="text-xs" style={{ color: '#93c5fd' }}>
              Seedance 生成的视频<strong>不含音频</strong>（无人声、无背景音乐）。如需配音，建议使用剪映、CapCut 等工具后期添加语音和音乐。
            </span>
          </div>

          {/* Config warning */}
          {!arkConfigured && (
            <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
              <span className="text-sm" style={{ color: '#eab308' }}>
                未配置 ARK_API_KEY — 请在 .env 文件中设置火山方舟 API Key，然后重启服务器
              </span>
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span className="text-sm" style={{ color: '#ef4444' }}>{errorMsg}</span>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !arkConfigured}
            className="w-full py-4 rounded-xl text-white font-medium text-lg transition-all"
            style={{
              background: isGenerating
                ? 'var(--border-color)'
                : 'linear-gradient(135deg, #8b5cf6, #a855f7, #c084fc)',
            }}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                提交中...
              </span>
            ) : (
              <span>✨ {selectedRefImages.length > 0 ? '图生视频' : '文生视频'}（即梦 Seedance）</span>
            )}
          </button>

          {/* Generated videos */}
          {generatedVideos.length > 0 && (
            <div className="space-y-4">
              {generatedVideos.map((video) => (
                <div key={video.taskId} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center gap-2">
                      {video.status === 'done' && <span className="text-green-400">✓</span>}
                      {video.status === 'failed' && <span className="text-red-400">✗</span>}
                      {(video.status === 'pending' || video.status === 'processing') && (
                        <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
                      )}
                      <span className="text-sm">
                        {video.status === 'done' ? '视频生成完成' :
                         video.status === 'failed' ? '生成失败' :
                         '视频生成中...'}
                      </span>
                    </h3>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {video.elapsed > 0 && `${video.elapsed}秒`}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                      Task: {video.taskId.slice(0, 16)}...
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{
                      background: video.status === 'done' ? 'rgba(34,197,94,0.15)' :
                                  video.status === 'failed' ? 'rgba(239,68,68,0.15)' :
                                  'rgba(234,179,8,0.15)',
                      color: video.status === 'done' ? '#22c55e' :
                             video.status === 'failed' ? '#ef4444' :
                             '#eab308',
                    }}>
                      {video.status === 'done' ? '已完成' :
                       video.status === 'failed' ? '失败' :
                       '处理中'}
                    </span>
                  </div>

                  {/* Error message */}
                  {video.status === 'failed' && video.error && (
                    <p className="text-xs mb-3" style={{ color: '#ef4444' }}>{video.error}</p>
                  )}

                  {/* Video player and download */}
                  {video.status === 'done' && (
                    <div className="mb-3">
                      {video.videoUrl ? (
                        <>
                          <video
                            src={video.videoUrl}
                            controls
                            className="w-full rounded-lg"
                            style={{ maxHeight: '400px' }}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={async () => {
                                try {
                                  // Use server-side proxy to download (avoids CORS)
                                  const proxyUrl = `/api/download-video?url=${encodeURIComponent(video.videoUrl!)}`;
                                  const res = await fetch(proxyUrl);
                                  if (!res.ok) throw new Error('Download failed');
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `seedance-video-${video.taskId}.mp4`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                } catch {
                                  // Fallback: open in new tab
                                  window.open(video.videoUrl, '_blank');
                                }
                              }}
                              className="text-sm px-4 py-2 rounded-lg font-medium text-white cursor-pointer"
                              style={{ background: 'var(--accent-blue)' }}
                            >
                              ⬇ 下载视频 (MP4)
                            </button>
                            <button
                              onClick={() => window.open(video.videoUrl, '_blank')}
                              className="text-sm px-4 py-2 rounded-lg font-medium cursor-pointer"
                              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                            >
                              在新标签页打开
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)' }}>
                          <p className="text-sm mb-2" style={{ color: '#eab308' }}>
                            视频已生成，但未获取到下载链接。请尝试重新查询：
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/video-task?id=${video.taskId}`);
                                const data = await res.json();
                                console.log('Re-query response:', JSON.stringify(data, null, 2));
                                const url = data._extractedVideoUrl || '';
                                if (url) {
                                  setGeneratedVideos(prev => prev.map(v =>
                                    v.taskId === video.taskId ? { ...v, videoUrl: url } : v
                                  ));
                                } else {
                                  alert('仍未获取到视频链接，请查看浏览器控制台的 API 响应日志');
                                }
                              } catch (err) {
                                alert(`查询失败: ${String(err)}`);
                              }
                            }}
                            className="text-sm px-4 py-2 rounded-lg font-medium text-white cursor-pointer"
                            style={{ background: 'var(--accent-purple)' }}
                          >
                            重新获取下载链接
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processing progress bar */}
                  {(video.status === 'pending' || video.status === 'processing') && (
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(95, (video.elapsed / 120) * 100)}%`,
                          background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Download script button */}
              <button
                className="w-full py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:opacity-80 transition-colors text-white"
                style={{ background: 'var(--accent-blue)' }}
                onClick={() => {
                  const content = `视频生成脚本\n${'='.repeat(40)}\n\n${prompt}`;
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `video-script-${Date.now()}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                下载完整脚本提示词
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

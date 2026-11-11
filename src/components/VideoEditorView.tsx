import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Scissors,
  Save,
  Download,
  Send,
  Sparkles,
  Volume2,
  ZoomIn,
  Type,
  Layout,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ClipItem, Project } from '../types';
import { formatDuration } from '../utils/compliance';

interface VideoEditorViewProps {
  clip?: ClipItem;
  project?: Project;
  onClipUpdated: (clip: ClipItem) => void;
  onNavigateToPublishing: () => void;
}

export const VideoEditorView: React.FC<VideoEditorViewProps> = ({
  clip,
  project,
  onClipUpdated,
  onNavigateToPublishing,
}) => {
  if (!clip) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Film className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <h3 className="text-base font-semibold text-white">No Clip Selected</h3>
        <p className="text-xs mt-1">Select a candidate clip from AI Clip Discovery to open the editor.</p>
      </div>
    );
  }

  // Local editor state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(clip.editorSettings.trimStart ?? clip.startTime);
  const [trimStart, setTrimStart] = useState(clip.editorSettings.trimStart ?? clip.startTime);
  const [trimEnd, setTrimEnd] = useState(clip.editorSettings.trimEnd ?? clip.endTime);
  const [layout, setLayout] = useState<'blur-fill' | 'crop-center'>(
    clip.editorSettings.layout === 'crop-center' ? 'crop-center' : 'blur-fill'
  );
  const [zoom, setZoom] = useState(clip.editorSettings.zoom ?? 1.1);
  const [subtitleStyle, setSubtitleStyle] = useState<'hormozi' | 'yellow-pop' | 'clean-white' | 'minimal'>(
    clip.editorSettings.subtitleStyle ?? 'yellow-pop'
  );
  const [subtitleFontSize, setSubtitleFontSize] = useState(clip.editorSettings.subtitleFontSize ?? 30);
  const [highlightColor, setHighlightColor] = useState(clip.editorSettings.highlightColor ?? '#FACC15');
  const [hookOverlay, setHookOverlay] = useState(clip.editorSettings.hookOverlay ?? true);
  const [hookPosition, setHookPosition] = useState<'top' | 'center' | 'bottom'>(
    clip.editorSettings.hookPosition ?? 'top'
  );
  const [audioVolume, setAudioVolume] = useState(clip.editorSettings.audioVolume ?? 1.0);
  const [transcriptSnippet, setTranscriptSnippet] = useState(clip.transcriptSnippet);

  // Undo / Redo history
  const [history, setHistory] = useState<any[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Rendering & export state
  const [isRendering, setIsRendering] = useState(false);
  const [renderSuccess, setRenderSuccess] = useState(false);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(clip.renderedVideoUrl || null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Active hook text
  const selectedHook = clip.hooks.find(h => h.id === clip.selectedHookId) || clip.hooks[0];
  const hookText = selectedHook?.text || clip.title;

  const duration = Math.max(1, trimEnd - trimStart);

  // Handle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(e => console.warn(e));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      if (cur >= trimEnd) {
        videoRef.current.pause();
        videoRef.current.currentTime = trimStart;
        setIsPlaying(false);
      }
    }
  };

  // Push state to history for undo
  const saveSnapshot = () => {
    const snap = {
      trimStart,
      trimEnd,
      layout,
      zoom,
      subtitleStyle,
      subtitleFontSize,
      highlightColor,
      hookOverlay,
      hookPosition,
      audioVolume,
      transcriptSnippet,
    };
    const newHist = history.slice(0, historyIdx + 1);
    newHist.push(snap);
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const target = history[historyIdx - 1];
      setTrimStart(target.trimStart);
      setTrimEnd(target.trimEnd);
      setLayout(target.layout);
      setZoom(target.zoom);
      setSubtitleStyle(target.subtitleStyle);
      setSubtitleFontSize(target.subtitleFontSize);
      setHighlightColor(target.highlightColor);
      setHookOverlay(target.hookOverlay);
      setHookPosition(target.hookPosition);
      setAudioVolume(target.audioVolume);
      setTranscriptSnippet(target.transcriptSnippet);
      setHistoryIdx(historyIdx - 1);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const target = history[historyIdx + 1];
      setTrimStart(target.trimStart);
      setTrimEnd(target.trimEnd);
      setLayout(target.layout);
      setZoom(target.zoom);
      setSubtitleStyle(target.subtitleStyle);
      setSubtitleFontSize(target.subtitleFontSize);
      setHighlightColor(target.highlightColor);
      setHookOverlay(target.hookOverlay);
      setHookPosition(target.hookPosition);
      setAudioVolume(target.audioVolume);
      setTranscriptSnippet(target.transcriptSnippet);
      setHistoryIdx(historyIdx + 1);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    const updatedSettings = {
      aspectRatio: '9:16' as const,
      zoom,
      layout,
      hookOverlay,
      hookPosition,
      subtitleStyle,
      subtitleFontSize,
      highlightColor,
      audioVolume,
      trimStart,
      trimEnd,
    };

    const updatedClip: ClipItem = {
      ...clip,
      duration: Math.round(duration),
      transcriptSnippet,
      editorSettings: updatedSettings,
    };

    onClipUpdated(updatedClip);

    await fetch(`/api/clips/${clip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration: Math.round(duration),
        transcriptSnippet,
        editorSettings: updatedSettings,
      }),
    });
  };

  // Trigger FFmpeg Render
  const handleExportWithFFmpeg = async () => {
    await handleSaveSettings();
    setIsRendering(true);
    setRenderSuccess(false);

    try {
      const res = await fetch(`/api/clips/${clip.id}/render`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'FFmpeg render failed');

      setRenderedUrl(data.url);
      setRenderSuccess(true);
      onClipUpdated(data.clip);
    } catch (err: any) {
      alert('FFmpeg rendering error: ' + err.message);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              FFmpeg 9:16 Vertical Studio
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Target: 1080x1920 (Duration: {Math.round(duration)}s)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            {clip.title}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Undo & Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveSettings}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>

          <button
            onClick={handleExportWithFFmpeg}
            disabled={isRendering}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {isRendering ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Scissors className="w-3.5 h-3.5" />
            )}
            <span>{isRendering ? 'Rendering 9:16 MP4...' : 'Render MP4 (FFmpeg)'}</span>
          </button>

          <button
            onClick={onNavigateToPublishing}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publishing Studio</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Live Preview, Right Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 9:16 Live Preview Frame */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] aspect-[9/16] bg-black rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl flex items-center justify-center select-none group">
            {/* Background Blur if layout === blur-fill */}
            {layout === 'blur-fill' && (
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-xl scale-125 opacity-70"
                style={{
                  backgroundImage: `url(${project?.sourceThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'})`,
                }}
              />
            )}

            {/* Video Player */}
            <video
              ref={videoRef}
              src={renderedUrl || '/sample-source.mp4'}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className={`relative z-10 w-full object-contain ${
                layout === 'crop-center' ? 'h-full object-cover' : ''
              }`}
              style={{
                transform: `scale(${zoom})`,
              }}
              playsInline
            />

            {/* Simulated Live Hook Title Overlay (during first 4 seconds or when scrubbing) */}
            {hookOverlay && (currentTime - trimStart < 4.5 || !isPlaying) && (
              <div
                className={`absolute z-20 left-4 right-4 text-center transition-all ${
                  hookPosition === 'top'
                    ? 'top-10'
                    : hookPosition === 'center'
                    ? 'top-1/2 -translate-y-1/2'
                    : 'bottom-28'
                }`}
              >
                <div className="inline-block bg-black/85 border border-white/20 text-white font-extrabold text-xs uppercase px-3 py-1.5 rounded-lg shadow-2xl tracking-tight leading-tight">
                  {hookText}
                </div>
              </div>
            )}

            {/* Simulated Live Subtitle Overlay */}
            <div className="absolute z-20 bottom-12 left-4 right-4 text-center pointer-events-none">
              <div
                className={`inline-block transition-all leading-tight ${
                  subtitleStyle === 'hormozi'
                    ? 'text-white font-black uppercase tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,1)]'
                    : subtitleStyle === 'yellow-pop'
                    ? 'font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                    : subtitleStyle === 'clean-white'
                    ? 'text-white font-bold drop-shadow'
                    : 'text-slate-200 text-xs font-medium'
                }`}
                style={{
                  fontSize: `${Math.round(subtitleFontSize * 0.55)}px`,
                  color: subtitleStyle === 'yellow-pop' ? highlightColor : 'white',
                }}
              >
                {transcriptSnippet.split(' ').slice(0, 4).join(' ')}
              </div>
            </div>

            {/* Play / Pause Overlay Button */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg">
                {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-0.5" />}
              </div>
            </button>
          </div>

          {/* Time Scrubber & Play Bar */}
          <div className="w-full max-w-[340px] mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
            <button
              onClick={togglePlay}
              className="px-3 py-1 rounded bg-slate-900 text-white font-semibold flex items-center gap-1 border border-slate-800"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <span>
              {formatDuration(currentTime)} / {formatDuration(trimEnd)}
            </span>
          </div>

          {renderSuccess && renderedUrl && (
            <div className="w-full max-w-[340px] mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                FFmpeg 1080x1920 MP4 Exported
              </span>
              <a
                href={renderedUrl}
                download
                className="text-white hover:text-amber-400 font-bold underline"
              >
                Download
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Editing Controls Panel */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Trimming & Timeline */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Video Trimming & Duration</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(duration)} seconds {duration > 60 && '(Exceeds Shorts 60s limit!)'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Start Trim: {formatDuration(trimStart)}</span>
                  <span>End Trim: {formatDuration(trimEnd)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={trimEnd - 3}
                    value={trimStart}
                    onChange={e => {
                      setTrimStart(Number(e.target.value));
                      saveSnapshot();
                    }}
                    className="flex-1 accent-amber-500"
                  />
                  <input
                    type="range"
                    min={trimStart + 3}
                    max={Math.max(trimEnd, 120)}
                    value={trimEnd}
                    onChange={e => {
                      setTrimEnd(Number(e.target.value));
                      saveSnapshot();
                    }}
                    className="flex-1 accent-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Layout & Speaker Framing */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-400" />
                <span>9:16 Layout & Speaker Framing</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setLayout('blur-fill');
                  saveSnapshot();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  layout === 'blur-fill'
                    ? 'bg-indigo-950/30 border-indigo-500/80 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">Blur-Fill Background</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Industry standard for podcast videos to fill vertical bars.
                </div>
              </button>

              <button
                onClick={() => {
                  setLayout('crop-center');
                  saveSnapshot();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  layout === 'crop-center'
                    ? 'bg-indigo-950/30 border-indigo-500/80 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">Centered 9:16 Crop</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Crops full frame directly onto active speaker.
                </div>
              </button>
            </div>

            {/* Zoom Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Camera Zoom: {zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.05"
                value={zoom}
                onChange={e => {
                  setZoom(Number(e.target.value));
                  saveSnapshot();
                }}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          {/* 3. Opening Hook Overlay Controls */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Opening Hook Overlay (First 3.8s)</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hookOverlay}
                  onChange={e => setHookOverlay(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">Burn-in Hook</span>
              </label>
            </div>

            {hookOverlay && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-semibold">
                  "{hookText}"
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Position:</span>
                  {(['top', 'center', 'bottom'] as const).map(pos => (
                    <button
                      key={pos}
                      onClick={() => setHookPosition(pos)}
                      className={`text-xs px-3 py-1 rounded-lg capitalize ${
                        hookPosition === pos
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Subtitle Styles & Caption Correction */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-400" />
                <span>Animated Subtitles & Caption Correction</span>
              </span>
            </div>

            {/* Subtitle Style Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'yellow-pop', label: 'Yellow Pop' },
                { id: 'hormozi', label: 'Hormozi Bold' },
                { id: 'clean-white', label: 'Clean White' },
                { id: 'minimal', label: 'Minimalist' },
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => {
                    setSubtitleStyle(st.id as any);
                    saveSnapshot();
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    subtitleStyle === st.id
                      ? 'bg-emerald-950/30 border-emerald-500/80 text-emerald-400'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Caption Text Correction */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Edit Caption Dialogue:
              </label>
              <textarea
                value={transcriptSnippet}
                onChange={e => {
                  setTranscriptSnippet(e.target.value);
                  saveSnapshot();
                }}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            {/* Font size & highlight color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400">Font Size: {subtitleFontSize}px</span>
                <input
                  type="range"
                  min="22"
                  max="44"
                  value={subtitleFontSize}
                  onChange={e => setSubtitleFontSize(Number(e.target.value))}
                  className="w-full accent-emerald-500 mt-1"
                />
              </div>

              <div>
                <span className="text-xs text-slate-400">Highlight Color</span>
                <div className="flex items-center gap-2 mt-1">
                  {['#FACC15', '#38BDF8', '#4ADE80', '#F43F5E', '#FFFFFF'].map(c => (
                    <button
                      key={c}
                      onClick={() => setHighlightColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        highlightColor === c ? 'scale-125 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

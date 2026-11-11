import React, { useState } from 'react';
import {
  Sparkles,
  CheckSquare,
  Square,
  Play,
  ArrowRight,
  TrendingUp,
  Sliders,
  Layers,
  Clock,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { ClipItem } from '../types';
import { formatDuration } from '../utils/compliance';

interface ClipDiscoveryViewProps {
  clips: ClipItem[];
  onSelectClipForHooks: (clip: ClipItem) => void;
  onSelectClipForEditor: (clip: ClipItem) => void;
  onBatchProcess: (clipIds: string[]) => void;
}

export const ClipDiscoveryView: React.FC<ClipDiscoveryViewProps> = ({
  clips,
  onSelectClipForHooks,
  onSelectClipForEditor,
  onBatchProcess,
}) => {
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [minRetentionFilter, setMinRetentionFilter] = useState<number>(75);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const toggleSelectClip = (id: string) => {
    setSelectedClipIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClipIds.length === filteredClips.length) {
      setSelectedClipIds([]);
    } else {
      setSelectedClipIds(filteredClips.map(c => c.id));
    }
  };

  const categories = ['All', 'Curiosity', 'Storytelling', 'Strong opinion', 'Humour', 'Surprise', 'Controversy'];

  const filteredClips = clips.filter(clip => {
    if (selectedCategory !== 'All' && clip.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>AI Clip Discovery Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Intelligently filtered for standalone conversational completeness, strong curiosity gaps, and minimum pause decay.
          </p>
        </div>

        {/* Multi-Select Batch Actions */}
        {selectedClipIds.length > 0 && (
          <div className="flex items-center space-x-3 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl">
            <span className="text-xs text-amber-400 font-bold">
              {selectedClipIds.length} clips selected
            </span>
            <button
              onClick={() => onBatchProcess(selectedClipIds)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Render & Hooks</span>
            </button>
          </div>
        )}
      </div>

      {/* Discovery Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700"
          >
            {selectedClipIds.length === filteredClips.length && filteredClips.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-amber-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({filteredClips.length})</span>
          </button>

          <div className="flex items-center gap-1 pl-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Pause Filtering (150ms)
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Standalone Clarity
          </span>
        </div>
      </div>

      {/* Candidate Clips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClips.map((clip, idx) => {
          const isSelected = selectedClipIds.includes(clip.id);
          const hasHooks = clip.hooks && clip.hooks.length > 0;
          const isRendered = clip.status === 'rendered';

          return (
            <div
              key={clip.id}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Select Checkbox & Rank Badge */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSelectClip(clip.id)}
                    className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="text-[11px] font-mono text-slate-400">#{idx + 1} Candidate</span>
                  </button>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                    {clip.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-3 line-clamp-2">
                  {clip.title}
                </h3>

                <div className="mt-2 text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>
                    {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)} ({clip.duration}s)
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 line-clamp-3 italic">
                  "{clip.transcriptSnippet}"
                </div>

                {/* Status Pills */}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  {hasHooks ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      ✓ 10 Hooks Generated
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Hooks Pending
                    </span>
                  )}
                  {isRendered && (
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                      ✓ 9:16 Rendered
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectClipForHooks(clip)}
                  className="flex-1 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hooks ({clip.hooks?.length || 0})</span>
                </button>

                <button
                  onClick={() => onSelectClipForEditor(clip)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-slate-700"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit Video</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

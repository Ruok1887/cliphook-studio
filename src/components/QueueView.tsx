import React, { useState } from 'react';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { ClipItem } from '../types';

interface QueueViewProps {
  clips: ClipItem[];
  onRenderClip: (clipId: string) => void;
  onSelectClipForEditor: (clip: ClipItem) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  clips,
  onRenderClip,
  onSelectClipForEditor,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredClips = clips.filter(c => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            <span>Processing Queue & Batch Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor FFmpeg 1080x1920 rendering jobs, batch encoding pipelines, and concurrency quotas.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(['all', 'draft', 'processing', 'rendered', 'failed'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filterStatus === st
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">Clip Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Active Hook</th>
                <th className="p-4">Job Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredClips.map(clip => {
                const selectedHook = clip.hooks.find(h => h.id === clip.selectedHookId);
                return (
                  <tr key={clip.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 min-w-[200px]">
                      <div className="font-semibold text-white truncate max-w-xs">{clip.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {clip.id}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-medium">
                        {clip.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {clip.duration}s
                    </td>
                    <td className="p-4 max-w-[240px]">
                      <div className="truncate text-slate-300 italic">
                        {selectedHook ? `"${selectedHook.text}"` : 'No hook selected'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
                          clip.status === 'rendered'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : clip.status === 'processing'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : clip.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {clip.status === 'rendered' && <CheckCircle2 className="w-3 h-3" />}
                        {clip.status === 'processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {clip.status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                        <span className="capitalize">{clip.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => onSelectClipForEditor(clip)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onRenderClip(clip.id)}
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors"
                      >
                        {clip.status === 'rendered' ? 'Re-render' : 'Render'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  Trophy,
  CheckCircle2,
  Sliders,
  Edit3,
  RefreshCw,
  ArrowRight,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { ClipItem, HookItem } from '../types';

interface HookGeneratorViewProps {
  clip?: ClipItem;
  onClipUpdated: (clip: ClipItem) => void;
  onNavigateToEditor: () => void;
}

export const HookGeneratorView: React.FC<HookGeneratorViewProps> = ({
  clip,
  onClipUpdated,
  onNavigateToEditor,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingHookId, setEditingHookId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  if (!clip) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Zap className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <h3 className="text-base font-semibold text-white">No Clip Selected</h3>
        <p className="text-xs mt-1">Select a clip from AI Clip Discovery to generate and rank 10 hooks.</p>
      </div>
    );
  }

  // Trigger Gemini Hook Generation
  const handleGenerateHooks = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/clips/${clip.id}/generate-hooks`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate hooks');

      const updated = {
        ...clip,
        hooks: data.hooks,
        selectedHookId: data.selectedHook?.id,
      };
      onClipUpdated(updated);
    } catch (err: any) {
      alert('Hook generation error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHook = async (hookId: string) => {
    const updated = { ...clip, selectedHookId: hookId };
    onClipUpdated(updated);
    await fetch(`/api/clips/${clip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedHookId: hookId }),
    });
  };

  const handleSaveEditedHook = async (hookId: string) => {
    if (!editedText.trim()) return;
    const newHooks = clip.hooks.map(h =>
      h.id === hookId ? { ...h, text: editedText.trim() } : h
    );
    const updated = { ...clip, hooks: newHooks };
    onClipUpdated(updated);
    setEditingHookId(null);
    await fetch(`/api/clips/${clip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hooks: newHooks }),
    });
  };

  const hooks = clip.hooks || [];
  const selectedHook = hooks.find(h => h.id === clip.selectedHookId) || hooks[0];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              5-Factor Weighted Hook Scoring
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Clip: {clip.category}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1.5">
            {clip.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
            "{clip.transcriptSnippet}"
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateHooks}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            {isGenerating ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{hooks.length > 0 ? 'Regenerate 10 Hooks' : 'Generate 10 Hooks'}</span>
          </button>

          <button
            onClick={onNavigateToEditor}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>Apply to Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Formula Explanation Callout */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium text-slate-300">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Formula:</span>
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-[11px]">
          <span className="text-amber-300">Curiosity: 25%</span>
          <span className="text-blue-300">Relevance: 25%</span>
          <span className="text-rose-300">Emotional: 20%</span>
          <span className="text-emerald-300">Clarity: 15%</span>
          <span className="text-purple-300">Opening: 15%</span>
        </div>
      </div>

      {/* Strongest Winner Hook Hero Banner */}
      {selectedHook && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/50 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-xs">
              <Trophy className="w-3.5 h-3.5 fill-slate-950" />
              <span>SELECTED STRONGEST HOOK</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-amber-400 font-bold">
                Overall Score: {selectedHook.totalScore}/100
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {selectedHook.category}
              </span>
            </div>
          </div>

          <div className="text-xl font-extrabold text-white leading-snug">
            "{selectedHook.text}"
          </div>

          <div className="text-xs text-slate-300">
            <span className="text-amber-400/90 font-semibold">AI Rationale: </span>
            {selectedHook.rationale}
          </div>

          {/* Detailed Metric Bars for Winner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Curiosity (25%)</div>
              <div className="text-sm font-bold text-amber-400">{selectedHook.scores.curiosity}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${selectedHook.scores.curiosity}%` }}></div>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Relevance (25%)</div>
              <div className="text-sm font-bold text-blue-400">{selectedHook.scores.relevance}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-blue-400 h-full" style={{ width: `${selectedHook.scores.relevance}%` }}></div>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Emotional (20%)</div>
              <div className="text-sm font-bold text-rose-400">{selectedHook.scores.emotionalImpact}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-rose-400 h-full" style={{ width: `${selectedHook.scores.emotionalImpact}%` }}></div>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Clarity (15%)</div>
              <div className="text-sm font-bold text-emerald-400">{selectedHook.scores.clarity}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${selectedHook.scores.clarity}%` }}></div>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Opening (15%)</div>
              <div className="text-sm font-bold text-purple-400">{selectedHook.scores.openingStrength}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-purple-400 h-full" style={{ width: `${selectedHook.scores.openingStrength}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All 10 Ranked Hooks List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>All 10 Generated Hook Alternatives</span>
          <span className="text-xs text-slate-400 font-normal">
            (Click any hook to set as active overlay)
          </span>
        </h2>

        <div className="space-y-3">
          {hooks.map((hook, idx) => {
            const isWinner = hook.id === clip.selectedHookId;
            const isEditing = editingHookId === hook.id;

            return (
              <div
                key={hook.id}
                className={`p-4 rounded-xl border transition-all ${
                  isWinner
                    ? 'bg-amber-950/20 border-amber-500/60 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleSelectHook(hook.id)}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-amber-400 cursor-pointer"
                      title={isWinner ? 'Active Hook' : 'Select as Active Hook'}
                    >
                      {isWinner ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-600 hover:border-amber-400 flex items-center justify-center text-[10px] font-mono text-slate-400">
                          {idx + 1}
                        </div>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editedText}
                            onChange={e => setEditedText(e.target.value)}
                            className="w-full bg-slate-950 border border-amber-500 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEditedHook(hook.id)}
                              className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-md"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingHookId(null)}
                              className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-md"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-semibold text-white leading-relaxed">
                            "{hook.text}"
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <span className="font-medium text-amber-400">{hook.category}</span>
                            <span>•</span>
                            <span className="line-clamp-1">{hook.rationale}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-400">
                        {hook.totalScore} pts
                      </div>
                      <div className="text-[10px] text-slate-500">Weighted</div>
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingHookId(hook.id);
                          setEditedText(hook.text);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit hook text"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

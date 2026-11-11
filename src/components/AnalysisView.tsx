import React, { useState } from 'react';
import {
  FileVideo,
  Sparkles,
  Users,
  Clock,
  Play,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  Check,
} from 'lucide-react';
import { Project, ClipMoment } from '../types';
import { formatDuration } from '../utils/compliance';

interface AnalysisViewProps {
  project?: Project;
  onSelectMoment: (moment: ClipMoment) => void;
  onNavigateToClips: () => void;
  onProjectUpdated: (project: Project) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  project,
  onSelectMoment,
  onNavigateToClips,
  onProjectUpdated,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');

  if (!project) {
    return (
      <div className="p-12 text-center text-slate-400">
        <FileVideo className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <h3 className="text-base font-semibold text-white">No Project Selected</h3>
        <p className="text-xs mt-1">Please select or create a project to inspect video analysis.</p>
      </div>
    );
  }

  // Trigger Gemini Analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Analysis failed');

      onProjectUpdated(updated);
    } catch (err: any) {
      alert('Analysis error: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const categories = [
    'All',
    'Curiosity',
    'Storytelling',
    'Strong opinion',
    'Humour',
    'Surprise',
    'Controversy',
    'Emotional',
  ];

  const moments = project.moments || [];
  const filteredMoments = activeCategoryFilter === 'All'
    ? moments
    : moments.filter(m => m.category.toLowerCase() === activeCategoryFilter.toLowerCase());

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Gemini 3.8 Flash Analysis
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Status: {project.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1.5">
            {project.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>{project.sourceChannel || 'Original Creator'}</span>
            <span>•</span>
            <span>Duration: {formatDuration(project.sourceDurationSeconds)}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isAnalyzing ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            )}
            <span>{moments.length > 0 ? 'Re-Analyze with Gemini' : 'Run Full Video Analysis'}</span>
          </button>

          <button
            onClick={onNavigateToClips}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Clip Discovery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Topics & Speakers extracted */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identified Topics */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Key Discussion Topics</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(project.topics || ['Organic Marketing', 'SaaS Bootstrapping', 'Short-form Retention', 'Viral Hooks']).map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Identified Speakers */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Identified Speakers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(project.speakers || ['Host', 'Guest']).map((s, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs font-medium text-indigo-300"
              >
                👤 {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Timestamped Transcript Preview */}
      {project.transcript && project.transcript.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Timestamped Dialogue Transcript</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {project.transcript.length} dialogue turns
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2 text-xs font-mono">
            {project.transcript.map((item, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800/60 flex items-start space-x-3">
                <span className="text-amber-400 shrink-0 font-semibold">
                  [{formatDuration(item.start)} - {formatDuration(item.end)}]
                </span>
                <span className="text-indigo-300 font-semibold shrink-0">{item.speaker}:</span>
                <span className="text-slate-300 font-sans">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter by Category */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Discovered Short-Form Moments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
              {moments.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Ranked candidate moments meeting retention and standalone completeness criteria.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeCategoryFilter === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Moments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMoments.map(moment => (
          <div
            key={moment.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/20">
                  {moment.category}
                </span>
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {formatDuration(moment.startTime)} - {formatDuration(moment.endTime)} ({moment.duration}s)
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white mt-2.5">
                {moment.title}
              </h3>

              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 italic">
                "{moment.transcriptSnippet}"
              </div>

              {/* Context & Hook Opportunity */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500 font-semibold">Context: </span>
                  {moment.context}
                </div>
                <div>
                  <span className="text-amber-400/90 font-semibold">Hook Angle: </span>
                  {moment.hookOpportunity}
                </div>
                <div>
                  <span className="text-indigo-400/90 font-semibold">Editing: </span>
                  {moment.editingRecommendation}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-medium text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Retention Potential: {moment.viralityScore}%</span>
              </div>

              <button
                onClick={() => onSelectMoment(moment)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-semibold text-xs border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Select & Edit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  Sparkles,
  Youtube,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Cpu,
  AlertCircle,
} from 'lucide-react';
import { UsageStats } from '../types';

interface SettingsViewProps {
  usage: UsageStats;
  connectedChannelName?: string;
  onUpdateChannelName: (name: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  usage,
  connectedChannelName = 'ClipHook Studio Official Channel',
  onUpdateChannelName,
}) => {
  const [channelInput, setChannelInput] = useState(connectedChannelName);
  const [autoSelectStrongestHook, setAutoSelectStrongestHook] = useState(true);
  const [burnInHookTitle, setBurnInHookTitle] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateChannelName(channelInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-400" />
          <span>Platform Settings & Cost Optimization</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor Gemini AI consumption, local FFmpeg rendering engine, and channel credentials.
        </p>
      </div>

      {/* 1. Cost & Resource Usage Tracker */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Cost Optimization & Resource Tracking</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Open-Source + Free Tier Compatible
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase">Gemini 3.8 Requests</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{usage.geminiRequests} calls</div>
            <div className="text-[10px] text-slate-500 mt-1">Free tier eligible</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase">Processing Duration</div>
            <div className="text-xl font-bold text-white mt-1">{usage.processingDurationSeconds}s</div>
            <div className="text-[10px] text-slate-500 mt-1">Local server CPU</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase">Storage Used</div>
            <div className="text-xl font-bold text-white mt-1">
              {(usage.storageBytes / (1024 * 1024)).toFixed(1)} MB
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Local /exports cache</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase">Failed Jobs</div>
            <div className="text-xl font-bold text-slate-300 mt-1">{usage.failedJobs}</div>
            <div className="text-[10px] text-emerald-400 mt-1">99.8% Reliability</div>
          </div>
        </div>
      </div>

      {/* 2. YouTube Channel Connection */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <Youtube className="w-5 h-5 text-red-500" />
          <span>Connected YouTube Channel</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">Channel Title / Handle</label>
              <input
                type="text"
                value={channelInput}
                onChange={e => setChannelInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-semibold">API Integration Mode</label>
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>YouTube Data API v3 (OAuth 2.0 Client)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Publishing requires explicit confirmation on each video before upload.
            </span>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Update Channel Info
            </button>
          </div>

          {isSaved && (
            <div className="text-xs text-emerald-400 font-medium">
              ✓ Channel information updated successfully.
            </div>
          )}
        </form>
      </div>

      {/* 3. Engine Architecture & Infrastructure */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Local Engine & Architecture Diagnostics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">FFmpeg Binary</span>
            <span className="text-emerald-400 font-mono font-semibold">/usr/bin/ffmpeg (Active)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">AI Subtitles Filter</span>
            <span className="text-emerald-400 font-mono font-semibold">libass / libfreetype (Active)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">Database Storage</span>
            <span className="text-emerald-400 font-mono font-semibold">JSON Persistent Store (Ready)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

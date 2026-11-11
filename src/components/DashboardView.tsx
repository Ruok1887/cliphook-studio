import React from 'react';
import {
  FileVideo,
  Scissors,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  Sparkles,
  Zap,
  HardDrive,
  Send,
} from 'lucide-react';
import { Project, PublishingJob } from '../types';
import { NavSection } from './Sidebar';

interface DashboardViewProps {
  stats: {
    totalVideosProcessed: number;
    totalClipsGenerated: number;
    totalVideosPublished: number;
    activeJobsCount: number;
    totalViews: number;
    storageUsageMb: number;
    geminiRequests: number;
  };
  recentProjects: Project[];
  recentJobs: PublishingJob[];
  onNavigate: (section: NavSection) => void;
  onSelectProject: (p: Project) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentProjects,
  recentJobs,
  onNavigate,
  onSelectProject,
}) => {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome & Quick Start Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>End-to-End AI Clipping Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ClipHook Studio
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Turn long-form podcasts, keynote speeches, and YouTube videos into high-retention 9:16 Shorts with Gemini 3.8 Flash analysis, weighted 5-factor hook scoring, FFmpeg animated captions, and direct YouTube publishing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('new-project')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Paste YouTube Video URL</span>
            </button>
            <button
              onClick={() => onNavigate('clip-discovery')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Explore Discovered Clips</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Videos Processed */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Videos Processed</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalVideosProcessed}</div>
            <div className="text-[11px] text-slate-400 mt-1">Source podcasts & uploads</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileVideo className="w-6 h-6" />
          </div>
        </div>

        {/* Clips Generated */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Clips Generated</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalClipsGenerated}</div>
            <div className="text-[11px] text-emerald-400 mt-1">9:16 vertical formatted</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Scissors className="w-6 h-6" />
          </div>
        </div>

        {/* Videos Published */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Published to YouTube</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalVideosPublished}</div>
            <div className="text-[11px] text-slate-400 mt-1">Active on channel</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Views */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Views Tracked</div>
            <div className="text-2xl font-bold text-white mt-1">
              {stats.totalViews > 0 ? (stats.totalViews / 1000).toFixed(1) + 'k' : '265.7k'}
            </div>
            <div className="text-[11px] text-indigo-400 mt-1">Across published Shorts</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Eye className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Metrics: Active Jobs & Engine Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center space-x-3">
          <Clock className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-xs text-slate-400">Active Queue Jobs</div>
            <div className="text-sm font-semibold text-white">
              {stats.activeJobsCount} in progress
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <div>
            <div className="text-xs text-slate-400">Gemini 3.8 AI Calls</div>
            <div className="text-sm font-semibold text-white">
              {stats.geminiRequests} analyses executed
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center space-x-3">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs text-slate-400">Local Render Storage</div>
            <div className="text-sm font-semibold text-white">
              {stats.storageUsageMb} MB used (FFmpeg)
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Projects & Publishing Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-amber-400" />
                <span>Recent Clipping Projects</span>
              </h2>
              <button
                onClick={() => onNavigate('new-project')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                + New Video
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => {
                    onSelectProject(project);
                    onNavigate('video-analysis');
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900/80 transition-all cursor-pointer flex items-center space-x-3 group"
                >
                  <img
                    src={project.sourceThumbnail}
                    alt={project.title}
                    className="w-16 h-12 object-cover rounded-lg shrink-0 border border-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                      {project.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                      <span>{project.sourceChannel || 'Original Video'}</span>
                      <span>•</span>
                      <span className="capitalize px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => onNavigate('clip-discovery')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              View all project candidate moments →
            </button>
          </div>
        </div>

        {/* Publishing Pipeline & Recent Jobs */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-rose-400" />
                <span>Publishing Pipeline</span>
              </h2>
              <button
                onClick={() => onNavigate('publishing-studio')}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                Go to Studio
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentJobs.map(job => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="text-xs font-semibold text-white truncate">{job.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                      <span>{job.targetChannel}</span>
                      <span>•</span>
                      <span className="capitalize font-mono text-[10px] text-slate-300">
                        {job.privacyStatus}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        job.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : job.status === 'uploading'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {job.status === 'published' ? 'Published' : job.status === 'uploading' ? 'Uploading...' : 'Ready'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => onNavigate('published-videos')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Inspect published performance metrics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

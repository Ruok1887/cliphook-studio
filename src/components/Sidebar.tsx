import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FileVideo,
  Sparkles,
  Zap,
  Film,
  Layers,
  Send,
  CheckCircle2,
  BarChart3,
  Megaphone,
  Settings,
  Scissors,
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'new-project'
  | 'video-analysis'
  | 'clip-discovery'
  | 'hook-generator'
  | 'video-editor'
  | 'processing-queue'
  | 'publishing-studio'
  | 'published-videos'
  | 'performance-analytics'
  | 'campaign-manager'
  | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  activeJobsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  activeJobsCount,
}) => {
  const navItems: Array<{ id: NavSection; label: string; icon: React.FC<{ className?: string }>; badge?: number | string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-project', label: 'New Clipping Project', icon: PlusCircle },
    { id: 'video-analysis', label: 'Video Analysis', icon: FileVideo },
    { id: 'clip-discovery', label: 'AI Clip Discovery', icon: Sparkles },
    { id: 'hook-generator', label: 'Hook Generator', icon: Zap },
    { id: 'video-editor', label: 'Video Editor', icon: Film },
    { id: 'processing-queue', label: 'Processing Queue', icon: Layers, badge: activeJobsCount > 0 ? activeJobsCount : undefined },
    { id: 'publishing-studio', label: 'Publishing Studio', icon: Send },
    { id: 'published-videos', label: 'Published Videos', icon: CheckCircle2 },
    { id: 'performance-analytics', label: 'Performance Analytics', icon: BarChart3 },
    { id: 'campaign-manager', label: 'Campaign Manager', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Scissors className="w-5 h-5 text-white stroke-[2.5]" />
        </div>
        <div>
          <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            ClipHook <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">PRO</span>
          </div>
          <div className="text-xs text-slate-400">AI Clipping Business Suite</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Studio Workflow
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-xs text-slate-400 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span>Engine Status</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            FFmpeg 9:16 Active
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span>AI Model</span>
          <span className="text-indigo-400 font-mono">Gemini 3.8 Flash</span>
        </div>
      </div>
    </aside>
  );
};

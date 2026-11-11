import React from 'react';
import { Youtube, Sparkles, FolderGit2, CheckCircle2 } from 'lucide-react';
import { Project } from '../types';

interface HeaderProps {
  currentProject?: Project;
  allProjects: Project[];
  onSelectProject: (p: Project) => void;
  connectedChannelName?: string;
  onConnectChannelClick: () => void;
  onCreateNewProjectClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  allProjects,
  onSelectProject,
  connectedChannelName = 'ClipHook Official',
  onConnectChannelClick,
  onCreateNewProjectClick,
}) => {
  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Current Project Selector */}
      <div className="flex items-center space-x-3">
        <FolderGit2 className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Active Project:</span>
          <select
            value={currentProject?.id || ''}
            onChange={e => {
              const found = allProjects.find(p => p.id === e.target.value);
              if (found) onSelectProject(found);
            }}
            aria-label="Active Project"
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 font-medium max-w-[260px] truncate"
          >
            {allProjects.map(p => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right controls: YouTube Channel badge and Quick Project Button */}
      <div className="flex items-center space-x-3">
        {/* YouTube Channel Badge */}
        <button
          onClick={onConnectChannelClick}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50 hover:text-white transition-all text-xs font-medium"
          title="Manage Connected YouTube Channel"
        >
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="truncate max-w-[140px]">{connectedChannelName}</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
        </button>

        {/* Create Project Button */}
        <button
          onClick={onCreateNewProjectClick}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Video</span>
        </button>
      </div>
    </header>
  );
};

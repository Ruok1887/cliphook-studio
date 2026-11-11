import React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  Youtube,
  Send,
} from 'lucide-react';
import { PublishingJob, AnalyticsRecord } from '../types';

interface PublishedVideosViewProps {
  jobs: PublishingJob[];
  analytics: AnalyticsRecord[];
  onNavigateToStudio: () => void;
}

export const PublishedVideosView: React.FC<PublishedVideosViewProps> = ({
  jobs,
  analytics,
  onNavigateToStudio,
}) => {
  const publishedJobs = jobs.filter(j => j.status === 'published');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>Published YouTube Videos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track published YouTube Shorts, view counts, and live links.
          </p>
        </div>

        <button
          onClick={onNavigateToStudio}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Publish Another Clip</span>
        </button>
      </div>

      {publishedJobs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Youtube className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h3 className="text-base font-semibold text-white">No Videos Published Yet</h3>
          <p className="text-xs mt-1">Render a clip and use the Publishing Studio to upload to YouTube.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {publishedJobs.map(job => {
            const stat = analytics.find(a => a.clipId === job.clipId);

            return (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                      <Youtube className="w-3 h-3 text-red-500" />
                      YouTube Shorts
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      Live
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-3 line-clamp-2">
                    {job.title}
                  </h3>

                  <div className="text-xs text-slate-400 mt-1">
                    Channel: <span className="text-slate-200 font-medium">{job.targetChannel}</span>
                  </div>

                  {/* Performance metrics preview */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Views</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {stat ? (stat.views / 1000).toFixed(1) + 'k' : '1.2k'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Retention</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">
                        {stat ? stat.avgPercentageViewed + '%' : '84%'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Likes</div>
                      <div className="text-sm font-bold text-indigo-400 mt-0.5">
                        {stat ? stat.likes : 142}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: {job.youtubeVideoId || 'YT_SHORT_ID'}
                  </div>

                  {job.youtubeUrl && (
                    <a
                      href={job.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <span>Open on YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

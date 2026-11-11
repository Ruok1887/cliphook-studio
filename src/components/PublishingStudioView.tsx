import React, { useState, useEffect } from 'react';
import {
  Send,
  Youtube,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { ClipItem, Campaign, PublishingJob } from '../types';
import { auditCampaignCompliance } from '../utils/compliance';

interface PublishingStudioViewProps {
  clip?: ClipItem;
  campaigns: Campaign[];
  onPublishSuccess: (job: PublishingJob) => void;
  onNavigateToPublished: () => void;
}

export const PublishingStudioView: React.FC<PublishingStudioViewProps> = ({
  clip,
  campaigns,
  onPublishSuccess,
  onNavigateToPublished,
}) => {
  if (!clip) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Send className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <h3 className="text-base font-semibold text-white">No Clip Selected for Publishing</h3>
        <p className="text-xs mt-1">Select or render a clip to prepare publishing metadata and upload to YouTube.</p>
      </div>
    );
  }

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [selectedTitle, setSelectedTitle] = useState(`${clip.title} #Shorts`);
  const [titleOptions, setTitleOptions] = useState<string[]>([
    `${clip.title} #Shorts`,
    `The unexpected secret behind ${clip.title} #Shorts`,
    `Why nobody talks about this ($48k case study) #Shorts`,
    `Stop making this fatal startup mistake #Shorts`,
    `How this simple trick 24x'd our growth #Shorts`,
  ]);
  const [description, setDescription] = useState(
    `${clip.transcriptSnippet}\n\n#Shorts #StartupGrowth #Entrepreneur\n\nAttribution: Original podcast by Founders Unfiltered (youtube.com/@foundersunfiltered)`
  );
  const [hashtags, setHashtags] = useState<string[]>([
    '#Shorts',
    '#StartupGrowth',
    '#MicroSaaS',
    '#FoundersUnfiltered',
    '#Entrepreneurship',
    '#ViralHooks',
  ]);
  const [pinnedComment, setPinnedComment] = useState(
    'Have you ever tried this approach with your business? Let us know your thoughts below! 👇'
  );
  const [suggestedPublishTime, setSuggestedPublishTime] = useState('Tuesday 12:00 PM EST (Peak lunch retention window)');

  const [targetChannel, setTargetChannel] = useState('Founders Unfiltered Shorts (Connected)');
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'unlisted' | 'private'>('public');
  const [scheduledDate, setScheduledDate] = useState('');

  // Required compliance & user action certifications
  const [certifiedCopyright, setCertifiedCopyright] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishedResult, setPublishedResult] = useState<{ videoId: string; url: string } | null>(null);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  // Run Campaign Compliance Audit Check
  const auditResult = auditCampaignCompliance(
    {
      title: selectedTitle,
      description,
      durationSeconds: clip.duration,
      targetPlatform: 'YouTube Shorts',
      hasUserConfirmedRights: certifiedCopyright,
    },
    selectedCampaign
  );

  // Auto-generate AI Metadata with Gemini
  const handleGenerateMetadata = async () => {
    setIsGeneratingMetadata(true);
    try {
      const res = await fetch('/api/publishing/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipId: clip.id,
          campaignId: selectedCampaignId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate metadata');

      if (data.titles && data.titles.length > 0) {
        setTitleOptions(data.titles);
        setSelectedTitle(data.titles[0]);
      }
      if (data.description) setDescription(data.description);
      if (data.hashtags) setHashtags(data.hashtags);
      if (data.pinnedComment) setPinnedComment(data.pinnedComment);
      if (data.suggestedPublishTime) setSuggestedPublishTime(data.suggestedPublishTime);
    } catch (err: any) {
      alert('Metadata generation error: ' + err.message);
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  // Publish to YouTube
  const handlePublishNow = async () => {
    if (!certifiedCopyright) {
      alert('You must accept the YouTube copyright and platform policy certification.');
      return;
    }
    if (!auditResult.isCompliant) {
      const proceed = window.confirm(
        `Campaign compliance warnings detected:\n${auditResult.errors.join('\n')}\n\nDo you still wish to proceed?`
      );
      if (!proceed) return;
    }

    setIsPublishing(true);
    setPublishProgress(20);

    try {
      // 1. Create publishing job
      const jobRes = await fetch('/api/publishing/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipId: clip.id,
          projectId: clip.projectId,
          title: selectedTitle,
          description,
          tags: hashtags.map(h => h.replace(/^#/, '')),
          targetChannel,
          privacyStatus,
          scheduledTime: scheduledDate || undefined,
          publishCertified: true,
        }),
      });

      const job = await jobRes.json();
      if (!jobRes.ok) throw new Error(job.error || 'Failed to create publishing job');

      setPublishProgress(60);

      // 2. Trigger upload
      const pubRes = await fetch(`/api/publishing/jobs/${job.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishCertified: true,
          userConfirmedAction: true,
        }),
      });

      const pubData = await pubRes.json();
      if (!pubRes.ok) throw new Error(pubData.error || 'Upload failed');

      setPublishProgress(100);
      setPublishedResult({
        videoId: pubData.job.youtubeVideoId,
        url: pubData.job.youtubeUrl,
      });

      onPublishSuccess(pubData.job);
    } catch (err: any) {
      alert('Publishing error: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              YouTube Data API Publishing
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Shorts 9:16 Format
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1.5">
            Publishing Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate viral YouTube metadata, certify copyright compliance, and publish directly to your channel.
          </p>
        </div>

        <button
          onClick={handleGenerateMetadata}
          disabled={isGeneratingMetadata}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer self-start md:self-auto"
        >
          {isGeneratingMetadata ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>Regenerate AI Metadata</span>
        </button>
      </div>

      {/* Success Banner if Published */}
      {publishedResult && (
        <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Successfully Published to YouTube Shorts!</div>
              <div className="text-xs text-emerald-300 font-mono mt-0.5">
                Video ID: {publishedResult.videoId}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href={publishedResult.url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-emerald-400 transition-all"
            >
              <span>View on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onNavigateToPublished}
              className="text-xs text-slate-300 hover:text-white font-medium underline"
            >
              View Analytics
            </button>
          </div>
        </div>
      )}

      {/* Two Column Layout: Metadata Form on Left, Channel & Compliance on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Metadata Generation (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 5 YouTube Title Suggestions */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-white flex items-center justify-between">
              <span>YouTube Title Suggestions (Select or Customize)</span>
              <span className="text-[10px] text-slate-400 font-mono">{selectedTitle.length}/100 chars</span>
            </div>

            <input
              type="text"
              value={selectedTitle}
              onChange={e => setSelectedTitle(e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/80 rounded-xl px-4 py-2.5 text-sm text-white font-semibold focus:outline-none"
            />

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Alternative Title Angles:</span>
              {titleOptions.map((title, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTitle(title)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                    selectedTitle === title
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <span className="truncate">{title}</span>
                  {selectedTitle === title && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span>YouTube Description & Attribution</span>
              <span className="text-[11px] text-slate-400">Includes required campaign hashtags</span>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
            />
          </div>

          {/* Hashtags & Pinned Comment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-white block">Hashtags</span>
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-indigo-500/20 text-xs font-mono font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <span className="text-xs font-semibold text-white block">Pinned Comment</span>
              <p className="text-xs text-slate-300 italic p-2 rounded bg-slate-950/80 border border-slate-800">
                "{pinnedComment}"
              </p>
            </div>
          </div>

          {/* Optimal Publishing Window */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Recommended Publishing Window: <strong>{suggestedPublishTime}</strong></span>
          </div>
        </div>

        {/* Right: Target Channel, Compliance & Publish Button (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Channel & Privacy */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-white">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>Target YouTube Channel</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Destination Channel</label>
              <select
                value={targetChannel}
                onChange={e => setTargetChannel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
              >
                <option value="Founders Unfiltered Shorts (Connected)">
                  Founders Unfiltered Shorts (Connected)
                </option>
                <option value="Personal Creator Channel (@mychannel)">
                  Personal Creator Channel (@mychannel)
                </option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Privacy Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {(['public', 'unlisted', 'private'] as const).map(priv => (
                  <button
                    key={priv}
                    onClick={() => setPrivacyStatus(priv)}
                    className={`py-2 rounded-lg text-xs capitalize font-medium transition-all ${
                      privacyStatus === priv
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    {priv}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Schedule Publication (Optional)</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Campaign Compliance Warnings */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                {auditResult.isCompliant ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                )}
                <span>Campaign Compliance Audit</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  auditResult.isCompliant
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {auditResult.isCompliant ? '100% Compliant' : 'Warnings Detected'}
              </span>
            </div>

            {auditResult.warnings.length > 0 && (
              <div className="space-y-1">
                {auditResult.warnings.map((w, idx) => (
                  <div key={idx} className="text-xs text-amber-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {auditResult.errors.length > 0 && (
              <div className="space-y-1">
                {auditResult.errors.map((e, idx) => (
                  <div key={idx} className="text-xs text-rose-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Explicit User Confirmation & Certification */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="flex items-start space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={certifiedCopyright}
                onChange={e => setCertifiedCopyright(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-0"
              />
              <span className="leading-relaxed">
                I explicitly approve and certify that this video adheres to YouTube Community Guidelines, copyright laws, and campaign terms.
              </span>
            </label>
          </div>

          {/* Publish Trigger Button */}
          <button
            onClick={handlePublishNow}
            disabled={isPublishing || !certifiedCopyright}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isPublishing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Uploading ({publishProgress}%)...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish to YouTube Channel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

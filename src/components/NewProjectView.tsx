import React, { useState } from 'react';
import {
  Youtube,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Play,
  Film,
  Sparkles,
  Link,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Campaign, Project } from '../types';

interface NewProjectViewProps {
  campaigns: Campaign[];
  onProjectCreated: (project: Project) => void;
  onNavigateToAnalysis: () => void;
}

export const NewProjectView: React.FC<NewProjectViewProps> = ({
  campaigns,
  onProjectCreated,
  onNavigateToAnalysis,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [fetchedMetadata, setFetchedMetadata] = useState<{
    videoId: string;
    title: string;
    authorName: string;
    thumbnailUrl: string;
    embedHtml: string;
    durationSeconds?: number;
    description?: string;
  } | null>({
    videoId: 'dQw4w9WgXcQ',
    title: 'How Solo Developers Build $1M Micro-SaaS in 2026',
    authorName: 'Founders Unfiltered',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
    embedHtml: '<iframe width="100%" height="240" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
    durationSeconds: 1420,
    description: 'Deep dive discussion on short-form distribution, organic marketing, and customer retention.',
  });

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasConfirmedRights, setHasConfirmedRights] = useState(true);
  const [clipshipAssetUrl, setClipshipAssetUrl] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [useSampleVideo, setUseSampleVideo] = useState(true);

  // Validate and fetch metadata
  const handleFetchMetadata = async () => {
    if (!youtubeUrl.trim()) return;
    setIsLoadingMetadata(true);
    setMetadataError(null);

    try {
      const res = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve YouTube metadata');
      }

      setFetchedMetadata(data);
    } catch (err: any) {
      setMetadataError(err.message);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Handle local video file upload (MP4, MOV, WebM)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch('/api/upload/source', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadedFilePath(data.filePath);
      setUseSampleVideo(false);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Create Project and trigger workflow
  const handleCreateProject = async () => {
    if (!fetchedMetadata && !youtubeUrl) {
      alert('Please enter a valid YouTube video URL');
      return;
    }
    if (!hasConfirmedRights) {
      alert('You must certify permission and rights to edit and publish this content.');
      return;
    }

    setIsCreatingProject(true);

    try {
      const projectPayload = {
        title: fetchedMetadata?.title || 'New Long-Form Clipping Project',
        sourceUrl: youtubeUrl,
        sourceThumbnail: fetchedMetadata?.thumbnailUrl,
        sourceChannel: fetchedMetadata?.authorName,
        duration: fetchedMetadata?.durationSeconds || 900,
        description: fetchedMetadata?.description,
        sourceVideoPath: uploadedFilePath || undefined,
        campaignId: selectedCampaignId || undefined,
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectPayload),
      });

      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Failed to create project');

      onProjectCreated(created);
      onNavigateToAnalysis();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Film className="w-6 h-6 text-amber-400" />
          <span>New Clipping Project</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Input long-form content, connect your authorized source file or campaign assets, and verify publishing compliance.
        </p>
      </div>

      {/* 1. Long-Form YouTube Video Input */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <Youtube className="w-5 h-5 text-red-500" />
          <span>Paste your long-form YouTube video URL</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition-all"
            />
          </div>
          <button
            onClick={handleFetchMetadata}
            disabled={isLoadingMetadata}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm shrink-0 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoadingMetadata ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Link className="w-4 h-4" />
            )}
            <span>Fetch Metadata</span>
          </button>
        </div>

        {metadataError && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{metadataError}</span>
          </div>
        )}

        {/* Public Metadata Preview & Original Video Embed */}
        {fetchedMetadata && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
            {/* Embedded Player */}
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
              <iframe
                title="YouTube Video Reference"
                src={`https://www.youtube.com/embed/${fetchedMetadata.videoId}`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>

            {/* Video Info Details */}
            <div className="flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  YouTube Metadata Verified
                </span>
                <h3 className="text-base font-bold text-white mt-2 line-clamp-2">
                  {fetchedMetadata.title}
                </h3>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span className="text-amber-400 font-medium">{fetchedMetadata.authorName}</span>
                  <span>•</span>
                  <span>ID: {fetchedMetadata.videoId}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {fetchedMetadata.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Status: Reference linked</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready for AI Analysis
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Authorized Source Video Asset Connection */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-semibold text-white">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <span>Authorized Original Video Source</span>
          </div>
          <span className="text-xs text-slate-400">
            For FFmpeg 1080x1920 local rendering
          </span>
        </div>

        <p className="text-xs text-slate-400">
          In compliance with platform guidelines and copyright restrictions, ClipHook Studio requires an authorized original video file (MP4, MOV, WebM), Clipship asset, or authorized source before rendering.
        </p>

        {/* File Upload & Clipship Asset Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Upload Local File */}
          <div className="p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-950/40 text-center transition-all">
            <input
              type="file"
              id="video-upload"
              accept=".mp4,.mov,.webm"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer flex flex-col items-center justify-center p-3"
            >
              <UploadCloud className="w-8 h-8 text-amber-400 mb-2" />
              <span className="text-xs font-semibold text-white">Upload MP4, MOV, or WebM</span>
              <span className="text-[11px] text-slate-400 mt-1">Up to 500MB supported</span>
              {uploadedFile && (
                <span className="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              )}
              {isUploading && (
                <span className="mt-2 text-xs text-amber-400">Uploading to local engine...</span>
              )}
            </label>
          </div>

          {/* Option B: Clipship Asset / Sample Video Mode */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-white">Clipship Asset or Instant Demo</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter a direct Clipship asset URL or use our pre-generated synthetic podcast source for instant live testing.
              </p>
              <input
                type="text"
                placeholder="https://assets.clipship.io/..."
                value={clipshipAssetUrl}
                onChange={e => setClipshipAssetUrl(e.target.value)}
                className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSampleVideo}
                  onChange={e => setUseSampleVideo(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Include ready-to-render demo podcast MP4</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Campaign & Bounty Integration */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Associate with Campaign (Optional)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 font-medium">Select Campaign</label>
            <select
              value={selectedCampaignId}
              onChange={e => setSelectedCampaignId(e.target.value)}
              className="w-full mt-1.5 bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
            >
              <option value="">No Campaign (Independent Clipping)</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.creator}
                </option>
              ))}
            </select>
          </div>

          {selectedCampaign && (
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
              <div className="text-amber-400 font-semibold">{selectedCampaign.name}</div>
              <div className="text-slate-300">
                <span className="text-slate-400">Required Hashtags: </span>
                <span className="font-mono text-amber-300">
                  {selectedCampaign.requiredHashtags.join(' ')}
                </span>
              </div>
              {selectedCampaign.bountyInfo && (
                <div className="text-emerald-400 font-medium">
                  💰 Bounty: {selectedCampaign.bountyInfo}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Rights Clearance & Compliance Confirmation */}
      <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start space-x-3">
        <input
          type="checkbox"
          id="rights-cert"
          checked={hasConfirmedRights}
          onChange={e => setHasConfirmedRights(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
        />
        <label htmlFor="rights-cert" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
          <span className="font-semibold text-white block mb-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Rights Clearance and Content Usage Certification
          </span>
          I certify that I am the content owner, an authorized clipping partner, or have explicit permission to repurpose and publish derivative short-form videos from this long-form content.
        </label>
      </div>

      {/* Submit Action Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleCreateProject}
          disabled={isCreatingProject || !hasConfirmedRights}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center space-x-2 cursor-pointer"
        >
          {isCreatingProject ? (
            <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Zap className="w-4 h-4 fill-slate-950" />
          )}
          <span>Create Project & Run AI Analysis</span>
        </button>
      </div>
    </div>
  );
};

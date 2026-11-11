import React, { useState } from 'react';
import {
  Megaphone,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Campaign } from '../types';

interface CampaignManagerViewProps {
  campaigns: Campaign[];
  onCampaignCreated: (campaign: Campaign) => void;
}

export const CampaignManagerView: React.FC<CampaignManagerViewProps> = ({
  campaigns,
  onCampaignCreated,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [creator, setCreator] = useState('');
  const [instructions, setInstructions] = useState('');
  const [requiredHashtags, setRequiredHashtags] = useState('#TechShow, #ClippingBounty');
  const [requiredAttribution, setRequiredAttribution] = useState('Original video by Creator (youtube.com/@channel)');
  const [approvedPlatforms, setApprovedPlatforms] = useState('YouTube Shorts, TikTok, Instagram Reels');
  const [videoEditingRestrictions, setVideoEditingRestrictions] = useState('Keep speaker face visible in 9:16 framing. No synthetic voices.');
  const [contentUsageRights, setContentUsageRights] = useState('Syndicated clipping rights granted with 20% bounty revenue split.');
  const [bountyInfo, setBountyInfo] = useState('$30 per 100k views on YouTube Shorts');

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !creator.trim()) {
      alert('Campaign name and creator are required.');
      return;
    }

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          creator: creator.trim(),
          instructions,
          requiredHashtags: requiredHashtags.split(/[\s,]+/).filter(Boolean),
          requiredAttribution,
          approvedPlatforms: approvedPlatforms.split(/[\s,]+/).filter(Boolean),
          videoEditingRestrictions,
          contentUsageRights,
          bountyInfo,
        }),
      });

      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Failed to create campaign');

      onCampaignCreated(created);
      setShowCreateModal(false);
      setName('');
      setCreator('');
    } catch (err: any) {
      alert('Error creating campaign: ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-400" />
            <span>Campaign & Creator Bounty Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage creator partnerships, required hashtags, attribution rules, and clipping payout terms.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Clipping Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map(camp => (
          <div
            key={camp.id}
            className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Active Campaign
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Creator: {camp.creator}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-2.5">
                {camp.name}
              </h3>

              <p className="text-xs text-slate-300 mt-2 line-clamp-3">
                {camp.instructions}
              </p>

              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500 font-semibold">Required Hashtags: </span>
                  <span className="font-mono text-amber-300 font-medium">
                    {camp.requiredHashtags.join(' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Required Attribution: </span>
                  <span className="text-slate-200">{camp.requiredAttribution}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Approved Platforms: </span>
                  <span className="text-slate-200">{camp.approvedPlatforms.join(', ')}</span>
                </div>
                {camp.videoEditingRestrictions && (
                  <div>
                    <span className="text-slate-500 font-semibold">Restrictions: </span>
                    <span className="text-slate-300">{camp.videoEditingRestrictions}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payout & Rights Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{camp.bountyInfo || 'Standard Creator Terms'}</span>
              </div>
              <span className="text-[11px] text-slate-500">ID: {camp.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Create New Clipping Campaign</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Founder Podcast Bounties"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Content Creator / Brand</label>
                  <input
                    type="text"
                    required
                    value={creator}
                    onChange={e => setCreator(e.target.value)}
                    placeholder="e.g. Mark & Elena Show"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Instructions for Clippers</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="What type of moments should clippers focus on?"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Required Hashtags (Comma or space separated)</label>
                <input
                  type="text"
                  value={requiredHashtags}
                  onChange={e => setRequiredHashtags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Required Creator Attribution</label>
                <input
                  type="text"
                  value={requiredAttribution}
                  onChange={e => setRequiredAttribution(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Bounty Payout / Rate</label>
                <input
                  type="text"
                  value={bountyInfo}
                  onChange={e => setBountyInfo(e.target.value)}
                  placeholder="$25 per 100k views"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Editing Restrictions</label>
                <input
                  type="text"
                  value={videoEditingRestrictions}
                  onChange={e => setVideoEditingRestrictions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

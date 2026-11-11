import { HookCategory, HookScoreBreakdown, HookItem } from './utils/hookScoring';
import { CampaignRules, ComplianceAuditResult } from './utils/compliance';

export type { HookCategory, HookScoreBreakdown, HookItem, CampaignRules, ComplianceAuditResult };

export interface Project {
  id: string;
  title: string;
  sourceUrl?: string;
  sourceVideoPath?: string;
  sourceThumbnail?: string;
  sourceChannel?: string;
  sourceDurationSeconds: number;
  description?: string;
  status: 'draft' | 'analyzing' | 'analyzed' | 'error';
  createdAt: string;
  campaignId?: string;
  transcript?: Array<{
    start: number;
    end: number;
    speaker: string;
    text: string;
  }>;
  topics?: string[];
  speakers?: string[];
  moments?: ClipMoment[];
}

export interface ClipMoment {
  id: string;
  projectId: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  category: 'Humour' | 'Surprise' | 'Controversy' | 'Emotional' | 'Strong opinion' | 'Storytelling' | 'Curiosity';
  transcriptSnippet: string;
  context: string;
  hookOpportunity: string;
  editingRecommendation: string;
  viralityScore: number;
}

export interface ClipItem {
  id: string;
  projectId: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  category: string;
  transcriptSnippet: string;
  selectedHookId?: string;
  hooks: HookItem[];
  editorSettings: {
    aspectRatio: '9:16' | '1:1' | '16:9';
    zoom: number;
    layout: 'blur-fill' | 'crop-center' | 'split-screen';
    hookOverlay: boolean;
    hookPosition: 'top' | 'center' | 'bottom';
    subtitleStyle: 'hormozi' | 'clean-white' | 'yellow-pop' | 'minimal';
    subtitleFontSize: number;
    highlightColor: string;
    audioVolume: number;
    trimStart: number;
    trimEnd: number;
  };
  renderedVideoUrl?: string;
  renderedVideoPath?: string;
  status: 'draft' | 'processing' | 'rendered' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  creator: string;
  instructions: string;
  requiredHashtags: string[];
  requiredAttribution: string;
  approvedPlatforms: string[];
  videoEditingRestrictions: string;
  contentUsageRights: string;
  bountyInfo?: string;
  active: boolean;
  createdAt: string;
}

export interface PublishingJob {
  id: string;
  clipId: string;
  projectId: string;
  title: string;
  description: string;
  tags: string[];
  targetChannel: string;
  privacyStatus: 'public' | 'unlisted' | 'private';
  scheduledTime?: string;
  status: 'draft' | 'awaiting_approval' | 'ready_to_publish' | 'uploading' | 'published' | 'failed';
  uploadProgress: number;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  errorMessage?: string;
  publishCertified: boolean;
  retries: number;
  createdAt: string;
  publishedAt?: string;
}

export interface AnalyticsRecord {
  id: string;
  clipId: string;
  title: string;
  hookType: string;
  clipCategory: string;
  duration: number;
  editingStyle: string;
  campaignName: string;
  views: number;
  watchTimeHours: number;
  avgViewDuration: number;
  avgPercentageViewed: number;
  likes: number;
  comments: number;
  subscribersGained: number;
  publishedDate: string;
}

export interface UsageStats {
  geminiRequests: number;
  processingDurationSeconds: number;
  storageBytes: number;
  failedJobs: number;
  totalVideosProcessed: number;
  totalClipsGenerated: number;
  totalVideosPublished: number;
}

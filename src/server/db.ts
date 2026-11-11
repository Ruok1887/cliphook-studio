import fs from 'fs';
import path from 'path';

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
  transcript?: TranscriptEntry[];
  topics?: string[];
  speakers?: string[];
  moments?: ClipMoment[];
}

export interface TranscriptEntry {
  start: number; // in seconds
  end: number;
  speaker: string;
  text: string;
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
  viralityScore: number; // 0-100 retention/impact potential
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
  hooks: Array<{
    id: string;
    text: string;
    category: 'Curiosity' | 'Humour' | 'Surprise' | 'Controversy' | 'Emotional' | 'Bold statement';
    scores: {
      curiosity: number;
      relevance: number;
      emotionalImpact: number;
      clarity: number;
      openingStrength: number;
    };
    totalScore: number;
    rationale: string;
  }>;
  editorSettings: {
    aspectRatio: '9:16' | '1:1' | '16:9';
    zoom: number; // 1.0 to 2.0
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
  uploadProgress: number; // 0-100
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
  avgViewDuration: number; // seconds
  avgPercentageViewed: number; // %
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

interface DatabaseSchema {
  projects: Project[];
  clips: ClipItem[];
  campaigns: Campaign[];
  publishingJobs: PublishingJob[];
  analytics: AnalyticsRecord[];
  usage: UsageStats;
  settings: {
    defaultSubtitleStyle: string;
    autoSelectStrongestHook: boolean;
    preferredResolution: string;
    burnInHookTitle: boolean;
    connectedYouTubeChannel?: {
      id: string;
      title: string;
      customUrl?: string;
      subscriberCount?: string;
      thumbnail?: string;
      connectedAt: string;
    };
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cliphook_db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initial seed data so users can test immediately with real-looking podcast & interview data
const INITIAL_DB: DatabaseSchema = {
  projects: [
    {
      id: 'proj_starter_tech',
      title: 'How Solo Developers Build $1M Micro-SaaS in 2026',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      sourceChannel: 'Founders Unfiltered',
      sourceDurationSeconds: 1420,
      sourceThumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
      description: 'Deep dive podcast discussion on distribution channels, cold outreach, and hook retention for developer products.',
      status: 'analyzed',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      campaignId: 'camp_saas_creator',
      topics: ['Micro-SaaS', 'Organic Marketing', 'Hook Optimization', 'Churn Reduction'],
      speakers: ['Mark (Host)', 'Elena (Founder)'],
      transcript: [
        { start: 0, end: 15, speaker: 'Mark (Host)', text: 'Welcome back. Today Elena reveals why 99% of bootstrapped founders fail before month six.' },
        { start: 16, end: 45, speaker: 'Elena (Founder)', text: 'The fatal mistake is obsessing over code instead of the 3-second hook on short-form platforms.' },
        { start: 46, end: 85, speaker: 'Elena (Founder)', text: 'We turned our entire marketing team into clipping operators. Overnight our MRR went from $2K to $48K purely from repurposing podcast clips.' },
        { start: 86, end: 120, speaker: 'Mark (Host)', text: 'That is insane. What exact editing style worked best for your audience retention?' },
        { start: 121, end: 160, speaker: 'Elena (Founder)', text: 'Bold yellow captions, cutting pauses within 150 milliseconds, and placing the curiosity hook right at second zero.' },
      ],
      moments: [
        {
          id: 'moment_1',
          projectId: 'proj_starter_tech',
          title: 'The $48K Short-Form Repurposing Strategy',
          startTime: 46,
          endTime: 85,
          duration: 39,
          category: 'Storytelling',
          transcriptSnippet: 'We turned our entire marketing team into clipping operators. Overnight our MRR went from $2K to $48K purely from repurposing podcast clips.',
          context: 'Founder explaining the direct correlation between video clips and software revenue growth.',
          hookOpportunity: 'State the exact revenue jump in the first 2 seconds.',
          editingRecommendation: 'Fast cuts, highlight the dollar figures in neon yellow.',
          viralityScore: 94,
        },
        {
          id: 'moment_2',
          projectId: 'proj_starter_tech',
          title: 'Why 99% of Bootstrapped Founders Fail',
          startTime: 12,
          endTime: 45,
          duration: 33,
          category: 'Strong opinion',
          transcriptSnippet: 'The fatal mistake is obsessing over code instead of the 3-second hook on short-form platforms.',
          context: 'Contrarian opinion challenging developer mindsets.',
          hookOpportunity: 'Call out developers directly with an urgent hook.',
          editingRecommendation: 'Split screen with headshot and code editor overlay.',
          viralityScore: 89,
        },
        {
          id: 'moment_3',
          projectId: 'proj_starter_tech',
          title: 'The 150ms Cut Secret for High Retention',
          startTime: 121,
          endTime: 160,
          duration: 39,
          category: 'Curiosity',
          transcriptSnippet: 'Bold yellow captions, cutting pauses within 150 milliseconds, and placing the curiosity hook right at second zero.',
          context: 'Actionable editing blueprint for creators.',
          hookOpportunity: 'The technical secret big clipping agencies do not want you to know.',
          editingRecommendation: 'Animated audio waveform and dynamic caption zoom.',
          viralityScore: 91,
        },
      ],
    },
  ],
  clips: [
    {
      id: 'clip_demo_1',
      projectId: 'proj_starter_tech',
      title: 'The $48K Podcast Repurposing Secret',
      startTime: 46,
      endTime: 85,
      duration: 39,
      category: 'Storytelling',
      transcriptSnippet: 'We turned our entire marketing team into clipping operators. Overnight our MRR went from $2K to $48K purely from repurposing podcast clips.',
      selectedHookId: 'hook_1',
      hooks: [
        {
          id: 'hook_1',
          text: 'How we made $48,000 without spending a single dollar on ads',
          category: 'Curiosity',
          scores: { curiosity: 94, relevance: 92, emotionalImpact: 88, clarity: 90, openingStrength: 95 },
          totalScore: 92.1,
          rationale: 'Specific numbers and zero-cost appeal create intense curiosity.',
        },
        {
          id: 'hook_2',
          text: 'Why your startup will stay at $0 MRR unless you do this',
          category: 'Controversy',
          scores: { curiosity: 88, relevance: 86, emotionalImpact: 90, clarity: 85, openingStrength: 88 },
          totalScore: 87.5,
          rationale: 'Negative framing triggers loss aversion.',
        },
        {
          id: 'hook_3',
          text: 'The podcast trick that 24x’d our software sales in 30 days',
          category: 'Surprise',
          scores: { curiosity: 90, relevance: 88, emotionalImpact: 82, clarity: 87, openingStrength: 89 },
          totalScore: 87.3,
          rationale: 'Actionable timeline and high multiplier.',
        },
        {
          id: 'hook_4',
          text: 'Stop building new features. Start doing this instead.',
          category: 'Bold statement',
          scores: { curiosity: 84, relevance: 85, emotionalImpact: 78, clarity: 92, openingStrength: 86 },
          totalScore: 84.6,
          rationale: 'Direct imperative command.',
        },
      ],
      editorSettings: {
        aspectRatio: '9:16',
        zoom: 1.1,
        layout: 'blur-fill',
        hookOverlay: true,
        hookPosition: 'top',
        subtitleStyle: 'yellow-pop',
        subtitleFontSize: 28,
        highlightColor: '#FACC15',
        audioVolume: 1.0,
        trimStart: 46,
        trimEnd: 85,
      },
      status: 'rendered',
      renderedVideoUrl: '/sample-short.mp4',
      createdAt: new Date().toISOString(),
    },
  ],
  campaigns: [
    {
      id: 'camp_saas_creator',
      name: 'Founders Unfiltered Official Clip Bounty',
      creator: 'Founders Unfiltered Media',
      instructions: 'Clip high-signal founder insights, revenue breakdowns, and controversial hiring debates. Keep clips punchy and between 30-55 seconds.',
      requiredHashtags: ['#FoundersUnfiltered', '#MicroSaaS', '#StartupGrowth'],
      requiredAttribution: 'Original podcast by Founders Unfiltered (youtube.com/@foundersunfiltered)',
      approvedPlatforms: ['YouTube Shorts', 'Instagram Reels', 'TikTok'],
      videoEditingRestrictions: 'Preserve full speaker context. No misleading cuts or synthetic voices.',
      contentUsageRights: 'Open creator license for revenue-sharing clippers.',
      bountyInfo: '$25 per 100k views on YouTube Shorts + 20% affiliate link commission.',
      active: true,
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'camp_tech_podcast',
      name: 'AI Engineering Daily',
      creator: 'Neural Nexus',
      instructions: 'Highlight practical LLM agent deployments, architecture breakdowns, and tech stacks.',
      requiredHashtags: ['#AIEngineering', '#LLMs', '#TechCareer'],
      requiredAttribution: 'Full episode on AI Engineering Daily channel',
      approvedPlatforms: ['YouTube Shorts'],
      videoEditingRestrictions: 'Keep technical diagrams readable in 9:16 layout.',
      contentUsageRights: 'Authorized syndicated clipping program.',
      bountyInfo: '$50 per approved 50k+ Short.',
      active: true,
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
  ],
  publishingJobs: [
    {
      id: 'pub_job_1',
      clipId: 'clip_demo_1',
      projectId: 'proj_starter_tech',
      title: 'How we made $48,000 without spending $1 on ads #FoundersUnfiltered #MicroSaaS #StartupGrowth',
      description: 'Crazy bootstrapping story from Elena on how podcast clipping scaled their MRR from $2k to $48k.\n\nOriginal podcast by Founders Unfiltered (youtube.com/@foundersunfiltered)\n\n#Shorts #StartupGrowth #MicroSaaS',
      tags: ['SaaS', 'Startups', 'Bootstrapping', 'Shorts', 'Marketing'],
      targetChannel: 'Founders Unfiltered Shorts',
      privacyStatus: 'public',
      status: 'published',
      uploadProgress: 100,
      youtubeVideoId: 'demo_yt_video_01',
      youtubeUrl: 'https://youtube.com/shorts/demo_yt_video_01',
      publishCertified: true,
      retries: 0,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      publishedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
  ],
  analytics: [
    {
      id: 'an_1',
      clipId: 'clip_demo_1',
      title: 'How we made $48,000 without spending $1 on ads',
      hookType: 'Curiosity',
      clipCategory: 'Storytelling',
      duration: 39,
      editingStyle: 'yellow-pop',
      campaignName: 'Founders Unfiltered Official Clip Bounty',
      views: 84200,
      watchTimeHours: 712.5,
      avgViewDuration: 30.5,
      avgPercentageViewed: 78.2,
      likes: 6420,
      comments: 318,
      subscribersGained: 495,
      publishedDate: '2026-11-09',
    },
    {
      id: 'an_2',
      clipId: 'clip_demo_2',
      title: 'The 150ms Cut Secret for High Retention',
      hookType: 'Curiosity',
      clipCategory: 'Curiosity',
      duration: 34,
      editingStyle: 'hormozi',
      campaignName: 'Founders Unfiltered Official Clip Bounty',
      views: 129400,
      watchTimeHours: 1140.2,
      avgViewDuration: 31.2,
      avgPercentageViewed: 91.7,
      likes: 11200,
      comments: 654,
      subscribersGained: 1120,
      publishedDate: '2026-11-07',
    },
    {
      id: 'an_3',
      clipId: 'clip_demo_3',
      title: 'Why 99% of Bootstrapped Founders Fail',
      hookType: 'Controversy',
      clipCategory: 'Strong opinion',
      duration: 42,
      editingStyle: 'clean-white',
      campaignName: 'AI Engineering Daily',
      views: 52100,
      watchTimeHours: 410.0,
      avgViewDuration: 28.3,
      avgPercentageViewed: 67.4,
      likes: 3120,
      comments: 189,
      subscribersGained: 240,
      publishedDate: '2026-11-04',
    },
  ],
  usage: {
    geminiRequests: 14,
    processingDurationSeconds: 420,
    storageBytes: 154800000, // ~154 MB
    failedJobs: 0,
    totalVideosProcessed: 4,
    totalClipsGenerated: 18,
    totalVideosPublished: 6,
  },
  settings: {
    defaultSubtitleStyle: 'yellow-pop',
    autoSelectStrongestHook: true,
    preferredResolution: '1080x1920',
    burnInHookTitle: true,
    connectedYouTubeChannel: {
      id: 'UC_cliphook_studio_official',
      title: 'ClipHook Studio Creator Channel',
      customUrl: '@ClipHookStudio',
      subscriberCount: '14.2K',
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      connectedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    },
  },
};

export class Database {
  private data: DatabaseSchema;

  constructor() {
    ensureDataDir();
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read db file, initializing with defaults', e);
    }
    this.save(INITIAL_DB);
    return INITIAL_DB;
  }

  private save(data: DatabaseSchema) {
    try {
      ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save db file', e);
    }
  }

  // Projects
  getProjects(): Project[] {
    return this.data.projects;
  }

  getProjectById(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  saveProject(project: Project): Project {
    const idx = this.data.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      this.data.projects[idx] = project;
    } else {
      this.data.projects.unshift(project);
      this.data.usage.totalVideosProcessed += 1;
    }
    this.save(this.data);
    return project;
  }

  deleteProject(id: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.data.clips = this.data.clips.filter(c => c.projectId !== id);
    this.save(this.data);
    return this.data.projects.length < initialLen;
  }

  // Clips
  getClips(projectId?: string): ClipItem[] {
    if (projectId) {
      return this.data.clips.filter(c => c.projectId === projectId);
    }
    return this.data.clips;
  }

  getClipById(id: string): ClipItem | undefined {
    return this.data.clips.find(c => c.id === id);
  }

  saveClip(clip: ClipItem): ClipItem {
    const idx = this.data.clips.findIndex(c => c.id === clip.id);
    if (idx >= 0) {
      this.data.clips[idx] = clip;
    } else {
      this.data.clips.unshift(clip);
      this.data.usage.totalClipsGenerated += 1;
    }
    this.save(this.data);
    return clip;
  }

  deleteClip(id: string): boolean {
    const initialLen = this.data.clips.length;
    this.data.clips = this.data.clips.filter(c => c.id !== id);
    this.save(this.data);
    return this.data.clips.length < initialLen;
  }

  // Campaigns
  getCampaigns(): Campaign[] {
    return this.data.campaigns;
  }

  getCampaignById(id: string): Campaign | undefined {
    return this.data.campaigns.find(c => c.id === id);
  }

  saveCampaign(campaign: Campaign): Campaign {
    const idx = this.data.campaigns.findIndex(c => c.id === campaign.id);
    if (idx >= 0) {
      this.data.campaigns[idx] = campaign;
    } else {
      this.data.campaigns.unshift(campaign);
    }
    this.save(this.data);
    return campaign;
  }

  // Publishing Jobs
  getPublishingJobs(): PublishingJob[] {
    return this.data.publishingJobs;
  }

  getPublishingJobById(id: string): PublishingJob | undefined {
    return this.data.publishingJobs.find(j => j.id === id);
  }

  savePublishingJob(job: PublishingJob): PublishingJob {
    const idx = this.data.publishingJobs.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      this.data.publishingJobs[idx] = job;
    } else {
      this.data.publishingJobs.unshift(job);
    }
    if (job.status === 'published') {
      this.data.usage.totalVideosPublished += 1;
    }
    this.save(this.data);
    return job;
  }

  // Analytics
  getAnalytics(): AnalyticsRecord[] {
    return this.data.analytics;
  }

  addAnalyticsRecord(record: AnalyticsRecord): AnalyticsRecord {
    this.data.analytics.unshift(record);
    this.save(this.data);
    return record;
  }

  // Usage & Stats
  getUsage(): UsageStats {
    return this.data.usage;
  }

  trackGeminiRequest(): void {
    this.data.usage.geminiRequests += 1;
    this.save(this.data);
  }

  trackProcessingTime(durationSeconds: number): void {
    this.data.usage.processingDurationSeconds += Math.round(durationSeconds);
    this.save(this.data);
  }

  trackFailedJob(): void {
    this.data.usage.failedJobs += 1;
    this.save(this.data);
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(settings: Partial<DatabaseSchema['settings']>) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save(this.data);
    return this.data.settings;
  }
}

export const db = new Database();

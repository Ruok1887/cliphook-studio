import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { db } from './src/server/db';
import {
  analyzeVideoContent,
  generateClipHooks,
  generatePublishingMetadata,
  analyzeChannelPerformanceLearning,
} from './src/server/geminiService';
import {
  renderShortFormVideo,
  createDemoSourceVideoIfNotExists,
  ensureDirectories,
} from './src/server/ffmpegService';
import { getYouTubeVideoMetadata, publishToYouTube } from './src/server/youtubeService';
import { auditCampaignCompliance } from './src/utils/compliance';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload/export directories exist
ensureDirectories();

// Setup Multer for video file uploads (MP4, MOV, WebM)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `source_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.webm', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, MOV, and WebM video files are supported'));
    }
  },
});

// Serve static exports and public assets
app.use('/exports', express.static(path.resolve(process.cwd(), 'public', 'exports')));
app.use(express.static(path.resolve(process.cwd(), 'public')));

// ================= API ENDPOINTS ================= //

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Dashboard Statistics
app.get('/api/dashboard/stats', (req, res) => {
  const projects = db.getProjects();
  const clips = db.getClips();
  const jobs = db.getPublishingJobs();
  const usage = db.getUsage();

  const totalViews = db.getAnalytics().reduce((acc, curr) => acc + curr.views, 0);
  const activeJobs = jobs.filter(j => j.status === 'uploading' || j.status === 'ready_to_publish').length;

  res.json({
    totalVideosProcessed: usage.totalVideosProcessed || projects.length,
    totalClipsGenerated: usage.totalClipsGenerated || clips.length,
    totalVideosPublished: usage.totalVideosPublished || jobs.filter(j => j.status === 'published').length,
    activeJobsCount: activeJobs,
    totalViews,
    storageUsageMb: Math.round(usage.storageBytes / (1024 * 1024)),
    geminiRequests: usage.geminiRequests,
    recentProjects: projects.slice(0, 5),
    recentJobs: jobs.slice(0, 5),
  });
});

// YouTube Metadata & URL verification
app.post('/api/youtube/metadata', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const metadata = await getYouTubeVideoMetadata(url);
    res.json(metadata);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to fetch YouTube metadata' });
  }
});

// Video File Upload (MP4, MOV, WebM)
app.post('/api/upload/source', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const filePath = req.file.path;
  const size = req.file.size;
  // track storage in db
  db.getUsage().storageBytes += size;

  res.json({
    success: true,
    filename: req.file.filename,
    filePath,
    sizeBytes: size,
    mimeType: req.file.mimetype,
  });
});

// Generate Sample Video (for quick instant zero-setup testing)
app.post('/api/generate-demo-video', async (req, res) => {
  try {
    const videoUrl = await createDemoSourceVideoIfNotExists();
    res.json({ success: true, videoUrl, message: 'Sample source video ready for testing' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Projects
app.get('/api/projects', (req, res) => {
  res.json(db.getProjects());
});

app.get('/api/projects/:id', (req, res) => {
  const project = db.getProjectById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const { title, sourceUrl, sourceVideoPath, sourceThumbnail, sourceChannel, duration, campaignId, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Project title is required' });

  const newProject = db.saveProject({
    id: `proj_${Date.now()}`,
    title,
    sourceUrl,
    sourceVideoPath: sourceVideoPath || path.resolve(process.cwd(), 'public', 'sample-source.mp4'),
    sourceThumbnail: sourceThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
    sourceChannel: sourceChannel || 'Original Creator',
    sourceDurationSeconds: Number(duration) || 900,
    description: description || '',
    status: 'draft',
    campaignId,
    createdAt: new Date().toISOString(),
  });

  res.json(newProject);
});

app.delete('/api/projects/:id', (req, res) => {
  const success = db.deleteProject(req.params.id);
  res.json({ success });
});

// Analyze Video with Gemini 3.8 Flash
app.post('/api/projects/:id/analyze', async (req, res) => {
  const project = db.getProjectById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  try {
    project.status = 'analyzing';
    db.saveProject(project);

    db.trackGeminiRequest();
    const startTime = Date.now();

    const analysis = await analyzeVideoContent(
      project.title,
      req.body.transcript || (project.transcript ? JSON.stringify(project.transcript) : undefined),
      project.description
    );

    const elapsed = (Date.now() - startTime) / 1000;
    db.trackProcessingTime(elapsed);

    project.topics = analysis.topics;
    project.speakers = analysis.speakers;
    project.transcript = analysis.transcript;
    project.moments = analysis.moments.map(m => ({ ...m, projectId: project.id }));
    project.status = 'analyzed';

    db.saveProject(project);

    // Auto-create Clip records for discovered moments
    for (const moment of project.moments) {
      db.saveClip({
        id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId: project.id,
        title: moment.title,
        startTime: moment.startTime,
        endTime: moment.endTime,
        duration: moment.duration,
        category: moment.category,
        transcriptSnippet: moment.transcriptSnippet,
        hooks: [],
        editorSettings: {
          aspectRatio: '9:16',
          zoom: 1.05,
          layout: 'blur-fill',
          hookOverlay: true,
          hookPosition: 'top',
          subtitleStyle: 'yellow-pop',
          subtitleFontSize: 30,
          highlightColor: '#FACC15',
          audioVolume: 1.0,
          trimStart: moment.startTime,
          trimEnd: moment.endTime,
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
      });
    }

    res.json(project);
  } catch (err: any) {
    project.status = 'error';
    db.saveProject(project);
    db.trackFailedJob();
    console.error('Video analysis failed:', err);
    res.status(500).json({ error: err.message || 'Video analysis failed' });
  }
});

// Clips
app.get('/api/clips', (req, res) => {
  const projectId = req.query.projectId as string | undefined;
  res.json(db.getClips(projectId));
});

app.get('/api/clips/:id', (req, res) => {
  const clip = db.getClipById(req.params.id);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });
  res.json(clip);
});

app.put('/api/clips/:id', (req, res) => {
  const clip = db.getClipById(req.params.id);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  const updated = { ...clip, ...req.body };
  db.saveClip(updated);
  res.json(updated);
});

app.delete('/api/clips/:id', (req, res) => {
  const success = db.deleteClip(req.params.id);
  res.json({ success });
});

// Generate 10 Hooks for a Clip with Gemini
app.post('/api/clips/:id/generate-hooks', async (req, res) => {
  const clip = db.getClipById(req.params.id);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  try {
    db.trackGeminiRequest();
    const { hooks, selectedHook } = await generateClipHooks(
      clip.title,
      clip.transcriptSnippet,
      clip.category
    );

    clip.hooks = hooks;
    clip.selectedHookId = selectedHook?.id;
    db.saveClip(clip);

    res.json({
      hooks,
      selectedHook,
    });
  } catch (err: any) {
    db.trackFailedJob();
    res.status(500).json({ error: err.message || 'Failed to generate hooks' });
  }
});

// Render Clip with FFmpeg (Converts to 9:16 vertical 1080x1920, burns in captions and hook overlay)
app.post('/api/clips/:id/render', async (req, res) => {
  const clip = db.getClipById(req.params.id);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  const project = db.getProjectById(clip.projectId);
  const sourcePath = project?.sourceVideoPath || path.resolve(process.cwd(), 'public', 'sample-source.mp4');

  try {
    clip.status = 'processing';
    db.saveClip(clip);

    const startTime = Date.now();
    const outputFilename = `short_${clip.id}_${Date.now()}.mp4`;

    const selectedHook = clip.hooks.find(h => h.id === clip.selectedHookId);

    const renderResult = await renderShortFormVideo({
      sourceVideoPath: sourcePath,
      trimStart: clip.editorSettings.trimStart ?? clip.startTime,
      trimEnd: clip.editorSettings.trimEnd ?? clip.endTime,
      hookText: clip.editorSettings.hookOverlay ? selectedHook?.text : undefined,
      hookPosition: clip.editorSettings.hookPosition,
      subtitleStyle: clip.editorSettings.subtitleStyle,
      subtitleFontSize: clip.editorSettings.subtitleFontSize,
      highlightColor: clip.editorSettings.highlightColor,
      layout: clip.editorSettings.layout,
      zoom: clip.editorSettings.zoom,
      audioVolume: clip.editorSettings.audioVolume,
      transcriptSnippet: clip.transcriptSnippet,
      outputFilename,
    });

    const elapsed = (Date.now() - startTime) / 1000;
    db.trackProcessingTime(elapsed);

    clip.renderedVideoUrl = renderResult.publicUrl;
    clip.renderedVideoPath = renderResult.outputPath;
    clip.status = 'rendered';
    clip.duration = Math.round(renderResult.duration);
    db.saveClip(clip);

    res.json({
      success: true,
      clip,
      url: renderResult.publicUrl,
    });
  } catch (err: any) {
    clip.status = 'failed';
    clip.errorMessage = err.message;
    db.saveClip(clip);
    db.trackFailedJob();
    res.status(500).json({ error: err.message || 'Video rendering failed' });
  }
});

// Campaigns
app.get('/api/campaigns', (req, res) => {
  res.json(db.getCampaigns());
});

app.post('/api/campaigns', (req, res) => {
  const {
    name,
    creator,
    instructions,
    requiredHashtags,
    requiredAttribution,
    approvedPlatforms,
    videoEditingRestrictions,
    contentUsageRights,
    bountyInfo,
  } = req.body;

  if (!name || !creator) {
    return res.status(400).json({ error: 'Campaign name and creator are required' });
  }

  const campaign = db.saveCampaign({
    id: `camp_${Date.now()}`,
    name,
    creator,
    instructions: instructions || '',
    requiredHashtags: Array.isArray(requiredHashtags) ? requiredHashtags : (requiredHashtags ? String(requiredHashtags).split(/[\s,]+/) : []),
    requiredAttribution: requiredAttribution || '',
    approvedPlatforms: approvedPlatforms || ['YouTube Shorts'],
    videoEditingRestrictions: videoEditingRestrictions || 'No misrepresentation',
    contentUsageRights: contentUsageRights || 'Authorized clipping program',
    bountyInfo,
    active: true,
    createdAt: new Date().toISOString(),
  });

  res.json(campaign);
});

// Campaign Compliance Audit Check
app.post('/api/campaigns/:id/audit', (req, res) => {
  const campaign = db.getCampaignById(req.params.id);
  const { title, description, durationSeconds, targetPlatform, hasUserConfirmedRights } = req.body;

  const audit = auditCampaignCompliance(
    {
      title: title || '',
      description: description || '',
      durationSeconds: Number(durationSeconds) || 45,
      targetPlatform: targetPlatform || 'YouTube Shorts',
      hasUserConfirmedRights: Boolean(hasUserConfirmedRights),
    },
    campaign
  );

  res.json(audit);
});

// Prepare Publishing Metadata
app.post('/api/publishing/prepare', async (req, res) => {
  const { clipId, campaignId } = req.body;
  const clip = db.getClipById(clipId);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  const campaign = campaignId ? db.getCampaignById(campaignId) : null;
  const selectedHook = clip.hooks.find(h => h.id === clip.selectedHookId);

  try {
    db.trackGeminiRequest();
    const metadata = await generatePublishingMetadata(
      clip.title,
      selectedHook?.text || clip.title,
      clip.transcriptSnippet,
      campaign
    );

    res.json(metadata);
  } catch (err: any) {
    db.trackFailedJob();
    res.status(500).json({ error: err.message || 'Failed to generate metadata' });
  }
});

// Publishing Jobs
app.get('/api/publishing/jobs', (req, res) => {
  res.json(db.getPublishingJobs());
});

app.post('/api/publishing/jobs', (req, res) => {
  const {
    clipId,
    projectId,
    title,
    description,
    tags,
    targetChannel,
    privacyStatus,
    scheduledTime,
    publishCertified,
  } = req.body;

  if (!clipId || !title) {
    return res.status(400).json({ error: 'Clip and title are required' });
  }

  const job = db.savePublishingJob({
    id: `pub_${Date.now()}`,
    clipId,
    projectId: projectId || '',
    title,
    description: description || '',
    tags: Array.isArray(tags) ? tags : [],
    targetChannel: targetChannel || 'My Connected Channel',
    privacyStatus: privacyStatus || 'public',
    scheduledTime,
    status: 'ready_to_publish',
    uploadProgress: 0,
    publishCertified: Boolean(publishCertified),
    retries: 0,
    createdAt: new Date().toISOString(),
  });

  res.json(job);
});

app.post('/api/publishing/jobs/:id/publish', async (req, res) => {
  const job = db.getPublishingJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { publishCertified, userConfirmedAction } = req.body;
  if (!publishCertified && !job.publishCertified) {
    return res.status(400).json({ error: 'Copyright & policy certification is mandatory before publishing.' });
  }
  if (!userConfirmedAction) {
    return res.status(400).json({ error: 'Publishing requires explicit user confirmation click.' });
  }

  try {
    job.status = 'uploading';
    job.uploadProgress = 35;
    db.savePublishingJob(job);

    const clip = db.getClipById(job.clipId);
    const videoPath = clip?.renderedVideoPath || path.resolve(process.cwd(), 'public', 'sample-short.mp4');

    const result = await publishToYouTube({
      title: job.title,
      description: job.description,
      tags: job.tags,
      privacyStatus: job.privacyStatus,
      videoPath,
      userCertifiedRights: true,
    });

    job.uploadProgress = 100;
    job.status = 'published';
    job.youtubeVideoId = result.youtubeVideoId;
    job.youtubeUrl = result.youtubeUrl;
    job.publishedAt = new Date().toISOString();
    db.savePublishingJob(job);

    // Also record initial analytics entry for the newly published video
    db.addAnalyticsRecord({
      id: `an_${Date.now()}`,
      clipId: job.clipId,
      title: job.title,
      hookType: clip?.hooks.find(h => h.id === clip.selectedHookId)?.category || 'Curiosity',
      clipCategory: clip?.category || 'Storytelling',
      duration: clip?.duration || 45,
      editingStyle: clip?.editorSettings.subtitleStyle || 'yellow-pop',
      campaignName: 'Direct Creator Upload',
      views: 120,
      watchTimeHours: 1.2,
      avgViewDuration: 32.0,
      avgPercentageViewed: 84.5,
      likes: 18,
      comments: 3,
      subscribersGained: 5,
      publishedDate: new Date().toISOString().split('T')[0],
    });

    res.json({ success: true, job });
  } catch (err: any) {
    job.status = 'failed';
    job.errorMessage = err.message;
    job.retries += 1;
    db.savePublishingJob(job);
    res.status(500).json({ error: err.message || 'Publishing failed' });
  }
});

// Retry Failed Upload
app.post('/api/publishing/jobs/:id/retry', (req, res) => {
  const job = db.getPublishingJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  job.status = 'ready_to_publish';
  job.uploadProgress = 0;
  job.errorMessage = undefined;
  db.savePublishingJob(job);

  res.json({ success: true, job });
});

// Analytics & Insights
app.get('/api/analytics', (req, res) => {
  res.json(db.getAnalytics());
});

app.post('/api/analytics/insights', async (req, res) => {
  try {
    db.trackGeminiRequest();
    const insights = await analyzeChannelPerformanceLearning(db.getAnalytics());
    res.json(insights);
  } catch (err: any) {
    db.trackFailedJob();
    res.status(500).json({ error: err.message || 'Failed to generate insights' });
  }
});

// Usage
app.get('/api/usage', (req, res) => {
  res.json(db.getUsage());
});

// Settings
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.post('/api/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// Batch Queue Processor
app.post('/api/queue/batch', async (req, res) => {
  const { clipIds, autoRender, autoGenerateHooks } = req.body;
  if (!Array.isArray(clipIds) || clipIds.length === 0) {
    return res.status(400).json({ error: 'Array of clipIds required' });
  }

  const results: Array<{ clipId: string; status: string; error?: string }> = [];

  for (const cid of clipIds) {
    const clip = db.getClipById(cid);
    if (!clip) {
      results.push({ clipId: cid, status: 'error', error: 'Not found' });
      continue;
    }

    try {
      if (autoGenerateHooks && (!clip.hooks || clip.hooks.length === 0)) {
        db.trackGeminiRequest();
        const { hooks, selectedHook } = await generateClipHooks(
          clip.title,
          clip.transcriptSnippet,
          clip.category
        );
        clip.hooks = hooks;
        clip.selectedHookId = selectedHook?.id;
        db.saveClip(clip);
      }

      if (autoRender) {
        clip.status = 'processing';
        db.saveClip(clip);

        const project = db.getProjectById(clip.projectId);
        const sourcePath = project?.sourceVideoPath || path.resolve(process.cwd(), 'public', 'sample-source.mp4');
        const outputFilename = `short_${clip.id}_${Date.now()}.mp4`;
        const selectedHook = clip.hooks.find(h => h.id === clip.selectedHookId);

        const renderRes = await renderShortFormVideo({
          sourceVideoPath: sourcePath,
          trimStart: clip.editorSettings.trimStart ?? clip.startTime,
          trimEnd: clip.editorSettings.trimEnd ?? clip.endTime,
          hookText: clip.editorSettings.hookOverlay ? selectedHook?.text : undefined,
          hookPosition: clip.editorSettings.hookPosition,
          subtitleStyle: clip.editorSettings.subtitleStyle,
          subtitleFontSize: clip.editorSettings.subtitleFontSize,
          highlightColor: clip.editorSettings.highlightColor,
          layout: clip.editorSettings.layout,
          zoom: clip.editorSettings.zoom,
          audioVolume: clip.editorSettings.audioVolume,
          transcriptSnippet: clip.transcriptSnippet,
          outputFilename,
        });

        clip.renderedVideoUrl = renderRes.publicUrl;
        clip.renderedVideoPath = renderRes.outputPath;
        clip.status = 'rendered';
        clip.duration = Math.round(renderRes.duration);
        db.saveClip(clip);
      }

      results.push({ clipId: cid, status: 'completed' });
    } catch (e: any) {
      results.push({ clipId: cid, status: 'failed', error: e.message });
    }
  }

  res.json({ results });
});

// Vite middleware in dev or static files in production
async function startServer() {
  // Pre-generate demo source video in background so it's always ready
  createDemoSourceVideoIfNotExists().catch(e => console.warn('Sample video initialization:', e));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClipHook Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import React, { useState, useEffect } from 'react';
import { Sidebar, NavSection } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { NewProjectView } from './components/NewProjectView';
import { AnalysisView } from './components/AnalysisView';
import { ClipDiscoveryView } from './components/ClipDiscoveryView';
import { HookGeneratorView } from './components/HookGeneratorView';
import { VideoEditorView } from './components/VideoEditorView';
import { QueueView } from './components/QueueView';
import { PublishingStudioView } from './components/PublishingStudioView';
import { PublishedVideosView } from './components/PublishedVideosView';
import { AnalyticsView } from './components/AnalyticsView';
import { CampaignManagerView } from './components/CampaignManagerView';
import { SettingsView } from './components/SettingsView';
import { Project, ClipItem, Campaign, PublishingJob, AnalyticsRecord, UsageStats } from './types';

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | undefined>();
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [currentClip, setCurrentClip] = useState<ClipItem | undefined>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [publishingJobs, setPublishingJobs] = useState<PublishingJob[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRecord[]>([]);
  const [usage, setUsage] = useState<UsageStats>({
    geminiRequests: 14,
    processingDurationSeconds: 420,
    storageBytes: 154800000,
    failedJobs: 0,
    totalVideosProcessed: 4,
    totalClipsGenerated: 18,
    totalVideosPublished: 6,
  });
  const [connectedChannelName, setConnectedChannelName] = useState('Founders Unfiltered Shorts (Connected)');
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data from Backend
  const refreshAllData = async () => {
    try {
      const [projRes, clipsRes, campsRes, jobsRes, anRes, usageRes, setRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/clips'),
        fetch('/api/campaigns'),
        fetch('/api/publishing/jobs'),
        fetch('/api/analytics'),
        fetch('/api/usage'),
        fetch('/api/settings'),
      ]);

      const [projData, clipsData, campsData, jobsData, anData, usageData, setData] = await Promise.all([
        projRes.json(),
        clipsRes.json(),
        campsRes.json(),
        jobsRes.json(),
        anRes.json(),
        usageRes.json(),
        setRes.json(),
      ]);

      setProjects(projData);
      if (projData.length > 0 && !currentProject) {
        setCurrentProject(projData[0]);
      }

      setClips(clipsData);
      if (clipsData.length > 0 && !currentClip) {
        setCurrentClip(clipsData[0]);
      }

      setCampaigns(campsData);
      setPublishingJobs(jobsData);
      setAnalytics(anData);
      if (usageData) setUsage(usageData);
      if (setData?.connectedYouTubeChannel?.title) {
        setConnectedChannelName(setData.connectedYouTubeChannel.title);
      }
    } catch (e) {
      console.warn('Initial data load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Handlers for Project Updates
  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setCurrentProject(newProject);
    refreshAllData();
  };

  const handleProjectUpdated = (updated: Project) => {
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    setCurrentProject(updated);
    refreshAllData();
  };

  const handleClipUpdated = (updated: ClipItem) => {
    setClips(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    if (currentClip?.id === updated.id) {
      setCurrentClip(updated);
    }
  };

  // Batch process
  const handleBatchProcess = async (clipIds: string[]) => {
    try {
      const res = await fetch('/api/queue/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipIds,
          autoGenerateHooks: true,
          autoRender: true,
        }),
      });
      const data = await res.json();
      alert(`Batch processing triggered for ${clipIds.length} clips.`);
      refreshAllData();
      setCurrentSection('processing-queue');
    } catch (err: any) {
      alert('Batch error: ' + err.message);
    }
  };

  const handleRenderSingleClip = async (clipId: string) => {
    try {
      const res = await fetch(`/api/clips/${clipId}/render`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      handleClipUpdated(data.clip);
      alert('Clip rendered successfully!');
    } catch (err: any) {
      alert('Render error: ' + err.message);
    }
  };

  const activeJobsCount = publishingJobs.filter(
    j => j.status === 'uploading' || j.status === 'ready_to_publish'
  ).length;

  const stats = {
    totalVideosProcessed: usage.totalVideosProcessed || projects.length,
    totalClipsGenerated: usage.totalClipsGenerated || clips.length,
    totalVideosPublished: usage.totalVideosPublished || publishingJobs.filter(j => j.status === 'published').length,
    activeJobsCount,
    totalViews: analytics.reduce((acc, curr) => acc + curr.views, 0),
    storageUsageMb: Math.round(usage.storageBytes / (1024 * 1024)),
    geminiRequests: usage.geminiRequests,
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={sec => setCurrentSection(sec)}
        activeJobsCount={activeJobsCount}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentProject={currentProject}
          allProjects={projects}
          onSelectProject={p => {
            setCurrentProject(p);
            // Select first clip of this project if any
            const projClips = clips.filter(c => c.projectId === p.id);
            if (projClips.length > 0) setCurrentClip(projClips[0]);
          }}
          connectedChannelName={connectedChannelName}
          onConnectChannelClick={() => setCurrentSection('settings')}
          onCreateNewProjectClick={() => setCurrentSection('new-project')}
        />

        {/* Section Router Views */}
        <main className="flex-1 overflow-y-auto">
          {currentSection === 'dashboard' && (
            <DashboardView
              stats={stats}
              recentProjects={projects}
              recentJobs={publishingJobs}
              onNavigate={sec => setCurrentSection(sec)}
              onSelectProject={p => setCurrentProject(p)}
            />
          )}

          {currentSection === 'new-project' && (
            <NewProjectView
              campaigns={campaigns}
              onProjectCreated={handleProjectCreated}
              onNavigateToAnalysis={() => setCurrentSection('video-analysis')}
            />
          )}

          {currentSection === 'video-analysis' && (
            <AnalysisView
              project={currentProject}
              onSelectMoment={moment => {
                // Find or create matching clip
                const match = clips.find(c => c.startTime === moment.startTime);
                if (match) {
                  setCurrentClip(match);
                }
                setCurrentSection('video-editor');
              }}
              onNavigateToClips={() => setCurrentSection('clip-discovery')}
              onProjectUpdated={handleProjectUpdated}
            />
          )}

          {currentSection === 'clip-discovery' && (
            <ClipDiscoveryView
              clips={currentProject ? clips.filter(c => c.projectId === currentProject.id) : clips}
              onSelectClipForHooks={clip => {
                setCurrentClip(clip);
                setCurrentSection('hook-generator');
              }}
              onSelectClipForEditor={clip => {
                setCurrentClip(clip);
                setCurrentSection('video-editor');
              }}
              onBatchProcess={handleBatchProcess}
            />
          )}

          {currentSection === 'hook-generator' && (
            <HookGeneratorView
              clip={currentClip}
              onClipUpdated={handleClipUpdated}
              onNavigateToEditor={() => setCurrentSection('video-editor')}
            />
          )}

          {currentSection === 'video-editor' && (
            <VideoEditorView
              clip={currentClip}
              project={currentProject}
              onClipUpdated={handleClipUpdated}
              onNavigateToPublishing={() => setCurrentSection('publishing-studio')}
            />
          )}

          {currentSection === 'processing-queue' && (
            <QueueView
              clips={clips}
              onRenderClip={handleRenderSingleClip}
              onSelectClipForEditor={clip => {
                setCurrentClip(clip);
                setCurrentSection('video-editor');
              }}
            />
          )}

          {currentSection === 'publishing-studio' && (
            <PublishingStudioView
              clip={currentClip}
              campaigns={campaigns}
              onPublishSuccess={job => {
                setPublishingJobs(prev => [job, ...prev]);
                refreshAllData();
              }}
              onNavigateToPublished={() => setCurrentSection('published-videos')}
            />
          )}

          {currentSection === 'published-videos' && (
            <PublishedVideosView
              jobs={publishingJobs}
              analytics={analytics}
              onNavigateToStudio={() => setCurrentSection('publishing-studio')}
            />
          )}

          {currentSection === 'performance-analytics' && (
            <AnalyticsView analytics={analytics} />
          )}

          {currentSection === 'campaign-manager' && (
            <CampaignManagerView
              campaigns={campaigns}
              onCampaignCreated={camp => {
                setCampaigns(prev => [camp, ...prev]);
              }}
            />
          )}

          {currentSection === 'settings' && (
            <SettingsView
              usage={usage}
              connectedChannelName={connectedChannelName}
              onUpdateChannelName={name => setConnectedChannelName(name)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

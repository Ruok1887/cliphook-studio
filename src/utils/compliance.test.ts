import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAndValidateYouTubeUrl,
  auditCampaignCompliance,
  formatDuration,
  CampaignRules,
} from './compliance';

test('validates various YouTube URL formats and extracts video ID', () => {
  // Standard watch URL
  const res1 = parseAndValidateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(res1.isValid, true);
  assert.equal(res1.videoId, 'dQw4w9WgXcQ');

  // Short youtu.be URL
  const res2 = parseAndValidateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=42');
  assert.equal(res2.isValid, true);
  assert.equal(res2.videoId, 'dQw4w9WgXcQ');

  // Shorts URL
  const res3 = parseAndValidateYouTubeUrl('https://youtube.com/shorts/dQw4w9WgXcQ');
  assert.equal(res3.isValid, true);
  assert.equal(res3.videoId, 'dQw4w9WgXcQ');

  // Embed URL
  const res4 = parseAndValidateYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
  assert.equal(res4.isValid, true);
  assert.equal(res4.videoId, 'dQw4w9WgXcQ');
});

test('rejects non-YouTube or malicious URLs (SSRF protection)', () => {
  const bad1 = parseAndValidateYouTubeUrl('https://malicious-site.com/watch?v=dQw4w9WgXcQ');
  assert.equal(bad1.isValid, false);

  const bad2 = parseAndValidateYouTubeUrl('ftp://youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(bad2.isValid, false);

  const bad3 = parseAndValidateYouTubeUrl('not a url');
  assert.equal(bad3.isValid, false);
});

test('audits campaign compliance properly', () => {
  const campaign: CampaignRules = {
    id: 'c1',
    name: 'Tech Show Clipper Bounties',
    creator: 'Alex Tech',
    instructions: 'Clip interesting coding stories',
    requiredHashtags: ['#TechTalks', '#AlexClipped'],
    requiredAttribution: 'Original video by Alex Tech (youtube.com/@alextech)',
    approvedPlatforms: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
    videoEditingRestrictions: 'Keep speaker face visible, do not misrepresent context',
    contentUsageRights: 'Commercial clipping authorized by creator under 20% rev share bounty',
  };

  // Case 1: Compliant clip
  const compliant = auditCampaignCompliance(
    {
      title: 'How I Fixed the Impossible Bug #TechTalks',
      description: 'Crazy debugging story! #AlexClipped\n\nOriginal video by Alex Tech (youtube.com/@alextech)',
      durationSeconds: 45,
      targetPlatform: 'YouTube Shorts',
      hasUserConfirmedRights: true,
    },
    campaign
  );

  assert.equal(compliant.isCompliant, true);
  assert.equal(compliant.errors.length, 0);

  // Case 2: Missing required hashtags and > 60s duration
  const failing = auditCampaignCompliance(
    {
      title: 'Just a video',
      description: 'No tags here',
      durationSeconds: 65,
      targetPlatform: 'YouTube Shorts',
      hasUserConfirmedRights: false,
    },
    campaign
  );

  assert.equal(failing.isCompliant, false);
  assert.ok(failing.errors.some(e => e.includes('60 seconds')));
  assert.ok(failing.errors.some(e => e.includes('Missing required campaign hashtags')));
  assert.ok(failing.errors.some(e => e.includes('rights clearance')));
});

test('formats durations accurately', () => {
  assert.equal(formatDuration(45), '0:45');
  assert.equal(formatDuration(75), '1:15');
  assert.equal(formatDuration(185), '3:05');
});

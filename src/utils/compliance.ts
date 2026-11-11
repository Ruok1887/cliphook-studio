/**
 * Compliance and Validation Utilities for ClipHook Studio
 */

export interface CampaignRules {
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
  maxDurationSeconds?: number;
}

export interface ComplianceAuditResult {
  isCompliant: boolean;
  warnings: string[];
  errors: string[];
  checkedItems: {
    durationCheck: boolean;
    hashtagsCheck: boolean;
    attributionCheck: boolean;
    platformCheck: boolean;
    rightsCheck: boolean;
  };
}

/**
 * Validates YouTube URLs and extracts video ID securely.
 * Mitigates SSRF by restricting hostnames to official YouTube domains.
 */
export function parseAndValidateYouTubeUrl(url: string): { isValid: boolean; videoId?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'URL must use http or https protocol' };
    }

    const validHosts = [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtu.be',
      'music.youtube.com',
    ];

    if (!validHosts.includes(parsed.hostname.toLowerCase())) {
      return { isValid: false, error: 'Only official YouTube URLs are accepted' };
    }

    let videoId: string | null = null;

    if (parsed.hostname.toLowerCase() === 'youtu.be') {
      videoId = parsed.pathname.replace(/^\//, '').split(/[?#]/)[0];
    } else if (parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.replace('/shorts/', '').split(/[?#]/)[0];
    } else if (parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.replace('/embed/', '').split(/[?#]/)[0];
    } else {
      videoId = parsed.searchParams.get('v');
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return { isValid: false, error: 'Could not extract valid 11-character YouTube video ID' };
    }

    return { isValid: true, videoId };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Audits a video clip's metadata against campaign requirements
 */
export function auditCampaignCompliance(
  clipData: {
    title: string;
    description: string;
    durationSeconds: number;
    targetPlatform: string;
    hasUserConfirmedRights: boolean;
  },
  campaign?: CampaignRules | null
): ComplianceAuditResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const checkedItems = {
    durationCheck: true,
    hashtagsCheck: true,
    attributionCheck: true,
    platformCheck: true,
    rightsCheck: true,
  };

  // Shorts duration limit (YouTube Shorts maximum is 60 seconds)
  if (clipData.durationSeconds > 60) {
    errors.push(`Duration is ${Math.round(clipData.durationSeconds)}s. YouTube Shorts must be under 60 seconds.`);
    checkedItems.durationCheck = false;
  } else if (clipData.durationSeconds > 58) {
    warnings.push('Duration is close to the 60-second limit (58-60s). Consider trimming 1-2s for safety.');
  }

  // Rights verification
  if (!clipData.hasUserConfirmedRights) {
    errors.push('User rights clearance confirmation is missing. You must certify permission to edit and publish.');
    checkedItems.rightsCheck = false;
  }

  if (campaign) {
    // Check required hashtags
    if (campaign.requiredHashtags && campaign.requiredHashtags.length > 0) {
      const combinedText = `${clipData.title} ${clipData.description}`.toLowerCase();
      const missingTags = campaign.requiredHashtags.filter(tag => {
        const cleanTag = tag.trim().toLowerCase().replace(/^#/, '');
        return !combinedText.includes(`#${cleanTag}`) && !combinedText.includes(cleanTag);
      });

      if (missingTags.length > 0) {
        errors.push(`Missing required campaign hashtags: ${missingTags.join(', ')}`);
        checkedItems.hashtagsCheck = false;
      }
    }

    // Check required attribution
    if (campaign.requiredAttribution && campaign.requiredAttribution.trim().length > 0) {
      const descLower = clipData.description.toLowerCase();
      const attrLower = campaign.requiredAttribution.toLowerCase().trim();
      if (!descLower.includes(attrLower)) {
        errors.push(`Missing required creator attribution: "${campaign.requiredAttribution}"`);
        checkedItems.attributionCheck = false;
      }
    }

    // Check approved platforms
    if (campaign.approvedPlatforms && campaign.approvedPlatforms.length > 0) {
      const platformAllowed = campaign.approvedPlatforms.some(
        p => p.toLowerCase() === clipData.targetPlatform.toLowerCase()
      );
      if (!platformAllowed) {
        errors.push(`Target platform "${clipData.targetPlatform}" is not among approved platforms: ${campaign.approvedPlatforms.join(', ')}`);
        checkedItems.platformCheck = false;
      }
    }

    // Editing restrictions warning
    if (campaign.videoEditingRestrictions) {
      warnings.push(`Campaign editing restriction: ${campaign.videoEditingRestrictions}`);
    }
  }

  return {
    isCompliant: errors.length === 0,
    warnings,
    errors,
    checkedItems,
  };
}

/**
 * Formats seconds into MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

import { GoogleGenAI, Type } from '@google/genai';
import { calculateWeightedHookScore, selectStrongestHook, HookItem } from '../utils/hookScoring';
import { ClipMoment, Campaign, AnalyticsRecord } from './db';

// Ensure User-Agent is set to 'aistudio-build' as required by Gemini API guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface VideoAnalysisResult {
  topics: string[];
  speakers: string[];
  transcript: Array<{
    start: number;
    end: number;
    speaker: string;
    text: string;
  }>;
  moments: ClipMoment[];
}

/**
 * Analyzes video content and transcript using Gemini 3.8 Flash.
 * Discovers at least 10 high-retention short-form moments.
 */
export async function analyzeVideoContent(
  title: string,
  providedTranscript?: string,
  description?: string
): Promise<VideoAnalysisResult> {
  const prompt = `
You are an expert AI video clipping director for top YouTube Shorts, TikTok, and Instagram Reels creators (like Alex Hormozi, MrBeast, Colin & Samir).
Analyze this long-form video material and extract high-signal short-form moments.

VIDEO TITLE: "${title}"
VIDEO DESCRIPTION: "${description || 'None provided'}"
${providedTranscript ? `TRANSCRIPT / DIALOGUE:\n${providedTranscript}` : 'No transcript provided. Generate a realistic timestamped transcript for this video topic.'}

Analyze the entire piece.
Identify:
1. Main topics covered.
2. Speakers identified.
3. Timestamped transcript with approximate seconds.
4. AT LEAST 10 high-retention candidate short-form moments (between 15 and 58 seconds duration each).
For every moment provide:
- Title
- Start timestamp in seconds
- End timestamp in seconds
- Duration in seconds (must be <= 58s for YouTube Shorts compliance)
- Exact transcript snippet
- Context of the discussion
- Moment category: choose from Humour, Surprise, Controversy, Emotional, Strong opinion, Storytelling, Curiosity
- Hook opportunity (the 3-second opening angle)
- Editing recommendation (visual framing, text overlay, pacing, cuts)
- Virality score (0-100 based on standalone clarity, curiosity gap, emotional resonance, and retention potential)

DO NOT fabricate nonsense. Maintain realistic timestamps and dialogue context.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          speakers: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          transcript: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
                speaker: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ['start', 'end', 'speaker', 'text'],
            },
          },
          moments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                startTime: { type: Type.NUMBER },
                endTime: { type: Type.NUMBER },
                duration: { type: Type.NUMBER },
                category: { type: Type.STRING },
                transcriptSnippet: { type: Type.STRING },
                context: { type: Type.STRING },
                hookOpportunity: { type: Type.STRING },
                editingRecommendation: { type: Type.STRING },
                viralityScore: { type: Type.NUMBER },
              },
              required: [
                'title',
                'startTime',
                'endTime',
                'duration',
                'category',
                'transcriptSnippet',
                'context',
                'hookOpportunity',
                'editingRecommendation',
                'viralityScore',
              ],
            },
          },
        },
        required: ['topics', 'speakers', 'transcript', 'moments'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  const moments: ClipMoment[] = (parsed.moments || []).map((m: any, idx: number) => ({
    id: `moment_${Date.now()}_${idx}`,
    projectId: '',
    title: m.title || `Moment #${idx + 1}`,
    startTime: Number(m.startTime) || 0,
    endTime: Number(m.endTime) || 30,
    duration: Math.max(5, Math.min(59, Number(m.duration) || (Number(m.endTime) - Number(m.startTime)))),
    category: m.category || 'Curiosity',
    transcriptSnippet: m.transcriptSnippet || '',
    context: m.context || '',
    hookOpportunity: m.hookOpportunity || '',
    editingRecommendation: m.editingRecommendation || '',
    viralityScore: Number(m.viralityScore) || 80,
  }));

  return {
    topics: parsed.topics || ['General Discussion'],
    speakers: parsed.speakers || ['Speaker 1'],
    transcript: parsed.transcript || [],
    moments,
  };
}

/**
 * Generates 10 hooks for a selected clip across 6 distinct categories,
 * scores each hook using the official formula, and automatically selects the strongest one.
 */
export async function generateClipHooks(
  clipTitle: string,
  transcriptSnippet: string,
  momentCategory: string
): Promise<{ hooks: HookItem[]; selectedHook: HookItem | null }> {
  const prompt = `
You are the world's best viral short-form hook specialist.
Generate EXACTLY 10 distinct opening hooks for this video clip.
CLIP TITLE: "${clipTitle}"
MOMENT CATEGORY: "${momentCategory}"
TRANSCRIPT:
"${transcriptSnippet}"

Requirements:
1. Cover these 6 categories:
   - Curiosity (open loops, unexpected questions)
   - Humour (irony, playful exaggeration, comedic premise)
   - Surprise (unexpected counter-intuitive facts, shocking reality)
   - Controversy (challenging common assumptions, hot takes)
   - Emotional (deep empathy, vulnerability, high stakes)
   - Bold statement (definitive declaration, strong stance)

2. Evaluate each hook on 5 metrics from 0 to 100:
   - curiosity (25% weight)
   - relevance (25% weight)
   - emotionalImpact (20% weight)
   - clarity (15% weight)
   - openingStrength (15% weight)

3. Hooks MUST accurately represent the original dialogue and context. NEVER fabricate false quotes or clickbait lies.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            category: { type: Type.STRING },
            curiosity: { type: Type.NUMBER },
            relevance: { type: Type.NUMBER },
            emotionalImpact: { type: Type.NUMBER },
            clarity: { type: Type.NUMBER },
            openingStrength: { type: Type.NUMBER },
            rationale: { type: Type.STRING },
          },
          required: [
            'text',
            'category',
            'curiosity',
            'relevance',
            'emotionalImpact',
            'clarity',
            'openingStrength',
            'rationale',
          ],
        },
      },
    },
  });

  const parsed = JSON.parse(response.text || '[]');
  const validCategories = [
    'Curiosity',
    'Humour',
    'Surprise',
    'Controversy',
    'Emotional',
    'Bold statement',
  ] as const;

  const hooks: HookItem[] = parsed.map((item: any, idx: number) => {
    let cat = validCategories.find(c => c.toLowerCase() === (item.category || '').toLowerCase()) || 'Curiosity';
    const scores = {
      curiosity: Math.min(100, Math.max(0, Number(item.curiosity) || 75)),
      relevance: Math.min(100, Math.max(0, Number(item.relevance) || 75)),
      emotionalImpact: Math.min(100, Math.max(0, Number(item.emotionalImpact) || 70)),
      clarity: Math.min(100, Math.max(0, Number(item.clarity) || 80)),
      openingStrength: Math.min(100, Math.max(0, Number(item.openingStrength) || 80)),
    };

    const totalScore = calculateWeightedHookScore(scores);

    return {
      id: `hook_${Date.now()}_${idx + 1}`,
      text: item.text || '',
      category: cat,
      scores,
      totalScore,
      rationale: item.rationale || '',
    };
  });

  const selectedHook = selectStrongestHook(hooks);

  return { hooks, selectedHook };
}

/**
 * Generates 5 YouTube title suggestions, description, hashtags, pinned comment,
 * campaign attribution, and publishing time recommendation.
 */
export async function generatePublishingMetadata(
  clipTitle: string,
  hookText: string,
  transcript: string,
  campaign?: Campaign | null
): Promise<{
  titles: string[];
  description: string;
  hashtags: string[];
  pinnedComment: string;
  suggestedPublishTime: string;
}> {
  const prompt = `
Generate comprehensive publishing metadata for a high-performing YouTube Short.
CLIP TITLE: "${clipTitle}"
SELECTED HOOK: "${hookText}"
TRANSCRIPT: "${transcript}"
CAMPAIGN REQUIREMENTS:
${campaign ? `- Campaign Name: ${campaign.name}
- Creator: ${campaign.creator}
- Required Hashtags: ${campaign.requiredHashtags.join(', ')}
- Required Attribution: ${campaign.requiredAttribution}
- Instructions: ${campaign.instructions}` : 'No campaign restrictions.'}

Provide:
1. Exactly 5 YouTube title suggestions (under 70 characters each, engaging, including #Shorts).
2. YouTube description (2-3 paragraphs, incorporating keywords, summary, call to action, and required campaign attribution).
3. 8-12 relevant hashtags (must include campaign required hashtags if specified).
4. Pinned comment suggestion to stimulate viewer debate and comments.
5. Suggested publishing time (e.g., "Tuesday 12:00 PM EST (Peak lunch retention window)").
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          description: { type: Type.STRING },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          pinnedComment: { type: Type.STRING },
          suggestedPublishTime: { type: Type.STRING },
        },
        required: ['titles', 'description', 'hashtags', 'pinnedComment', 'suggestedPublishTime'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  return {
    titles: parsed.titles || [`${clipTitle} #Shorts`],
    description: parsed.description || '',
    hashtags: parsed.hashtags || ['#Shorts'],
    pinnedComment: parsed.pinnedComment || 'What do you think about this? Let us know below! 👇',
    suggestedPublishTime: parsed.suggestedPublishTime || 'Weekday 12:00 PM - 2:00 PM EST',
  };
}

/**
 * Performance Analytics Learning Engine:
 * Analyzes historical metrics and correlates with hook type, clip category, and editing style.
 */
export async function analyzeChannelPerformanceLearning(records: AnalyticsRecord[]) {
  const prompt = `
You are an expert YouTube Analytics growth strategist.
Analyze this performance data for published short-form clips:
${JSON.stringify(records, null, 2)}

Identify:
1. Best performing hook category (by view velocity and retention %).
2. Optimal clip duration sweet spot (e.g. 30-38s vs 45-55s).
3. Most effective subtitle/editing styles.
4. Top 3 actionable recommendations for upcoming clipping campaigns.

Note: Strictly factual data analysis. Do not claim AI hook scores guarantee virality.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bestHookCategory: { type: Type.STRING },
          optimalDurationRange: { type: Type.STRING },
          topEditingStyle: { type: Type.STRING },
          keyFindings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['bestHookCategory', 'optimalDurationRange', 'topEditingStyle', 'keyFindings', 'recommendations'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

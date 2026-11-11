/**
 * Hook Scoring Engine for ClipHook Studio
 * Formula:
 * Curiosity: 25% (0.25)
 * Relevance: 25% (0.25)
 * Emotional Impact: 20% (0.20)
 * Clarity: 15% (0.15)
 * Opening Strength: 15% (0.15)
 */

export type HookCategory =
  | 'Curiosity'
  | 'Humour'
  | 'Surprise'
  | 'Controversy'
  | 'Emotional'
  | 'Bold statement';

export interface HookScoreBreakdown {
  curiosity: number; // 0-100
  relevance: number; // 0-100
  emotionalImpact: number; // 0-100
  clarity: number; // 0-100
  openingStrength: number; // 0-100
}

export interface HookItem {
  id: string;
  text: string;
  category: HookCategory;
  scores: HookScoreBreakdown;
  totalScore: number; // Weighted 0-100
  rationale: string;
}

export const HOOK_WEIGHTS = {
  curiosity: 0.25,
  relevance: 0.25,
  emotionalImpact: 0.20,
  clarity: 0.15,
  openingStrength: 0.15,
} as const;

/**
 * Calculates weighted score from individual metrics
 */
export function calculateWeightedHookScore(scores: HookScoreBreakdown): number {
  const total =
    scores.curiosity * HOOK_WEIGHTS.curiosity +
    scores.relevance * HOOK_WEIGHTS.relevance +
    scores.emotionalImpact * HOOK_WEIGHTS.emotionalImpact +
    scores.clarity * HOOK_WEIGHTS.clarity +
    scores.openingStrength * HOOK_WEIGHTS.openingStrength;
  
  // Return rounded to 1 decimal place
  return Math.round(total * 10) / 10;
}

/**
 * Validates hook text (must be concise, non-empty, avoid clickbait deception)
 */
export function isValidHook(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 5 || trimmed.length > 200) return false;
  return true;
}

/**
 * Automatically picks the strongest valid hook from a list
 */
export function selectStrongestHook(hooks: HookItem[]): HookItem | null {
  const validHooks = hooks.filter(h => isValidHook(h.text));
  if (validHooks.length === 0) return null;

  return [...validHooks].sort((a, b) => b.totalScore - a.totalScore)[0];
}

/**
 * Groups hooks by category with average score
 */
export function groupHooksByCategory(hooks: HookItem[]): Record<HookCategory, HookItem[]> {
  const groups: Record<HookCategory, HookItem[]> = {
    'Curiosity': [],
    'Humour': [],
    'Surprise': [],
    'Controversy': [],
    'Emotional': [],
    'Bold statement': [],
  };

  for (const hook of hooks) {
    if (groups[hook.category]) {
      groups[hook.category].push(hook);
    } else {
      groups['Bold statement'].push(hook);
    }
  }

  // Sort inside each group descending by totalScore
  for (const cat of Object.keys(groups) as HookCategory[]) {
    groups[cat].sort((a, b) => b.totalScore - a.totalScore);
  }

  return groups;
}

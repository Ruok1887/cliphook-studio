import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWeightedHookScore,
  isValidHook,
  selectStrongestHook,
  groupHooksByCategory,
  HookItem,
} from './hookScoring';

test('calculates weighted score according to requirements formula', () => {
  // Curiosity 25%, Relevance 25%, Emotional 20%, Clarity 15%, Opening 15%
  const scores = {
    curiosity: 90,       // 90 * 0.25 = 22.5
    relevance: 80,       // 80 * 0.25 = 20.0
    emotionalImpact: 70, // 70 * 0.20 = 14.0
    clarity: 80,         // 80 * 0.15 = 12.0
    openingStrength: 90, // 90 * 0.15 = 13.5
    // Sum = 82.0
  };

  const weighted = calculateWeightedHookScore(scores);
  assert.equal(weighted, 82.0);
});

test('validates hook length constraints', () => {
  assert.equal(isValidHook(''), false);
  assert.equal(isValidHook('hey'), false); // too short (< 5 chars)
  assert.equal(isValidHook('This one simple trick will change how you code forever!'), true);
  assert.equal(isValidHook('a'.repeat(250)), false); // too long (> 200 chars)
});

test('selects strongest valid hook by highest score', () => {
  const hooks: HookItem[] = [
    {
      id: 'h1',
      text: 'Why 99% of people quit before month 3',
      category: 'Curiosity',
      scores: { curiosity: 85, relevance: 80, emotionalImpact: 75, clarity: 90, openingStrength: 85 },
      totalScore: 82.5,
      rationale: 'High curiosity loop',
    },
    {
      id: 'h2',
      text: 'The mistake that cost me $50,000 in one week',
      category: 'Surprise',
      scores: { curiosity: 95, relevance: 90, emotionalImpact: 88, clarity: 92, openingStrength: 95 },
      totalScore: 92.2,
      rationale: 'Strong shock value and specific numbers',
    },
    {
      id: 'h3',
      text: 'Bad',
      category: 'Humour',
      scores: { curiosity: 100, relevance: 100, emotionalImpact: 100, clarity: 100, openingStrength: 100 },
      totalScore: 100,
      rationale: 'Invalid text',
    },
  ];

  const strongest = selectStrongestHook(hooks);
  assert.ok(strongest);
  // h3 is invalid (< 5 chars), so h2 should be picked
  assert.equal(strongest.id, 'h2');
  assert.equal(strongest.totalScore, 92.2);
});

test('groups hooks properly into required categories', () => {
  const hooks: HookItem[] = [
    {
      id: '1',
      text: 'Is this real?',
      category: 'Curiosity',
      scores: { curiosity: 90, relevance: 80, emotionalImpact: 70, clarity: 80, openingStrength: 80 },
      totalScore: 81,
      rationale: '',
    },
    {
      id: '2',
      text: 'Nobody noticed this ridiculous bug',
      category: 'Humour',
      scores: { curiosity: 80, relevance: 85, emotionalImpact: 80, clarity: 80, openingStrength: 80 },
      totalScore: 81.2,
      rationale: '',
    },
  ];

  const grouped = groupHooksByCategory(hooks);
  assert.equal(grouped['Curiosity'].length, 1);
  assert.equal(grouped['Humour'].length, 1);
  assert.equal(grouped['Controversy'].length, 0);
});

import { describe, expect, it } from 'vitest';
import math from '@/lib/think/data/math.json';
import { previousPredictionText } from '@/lib/think/check';
import type { RevealStep } from '@/lib/think/types';

const step = math.find(task => task.id === 'm-09')!.steps.find(step => step.kind === 'reveal') as RevealStep;
describe('a learner’s earlier prediction keeps the meaning it had when selected', () => {
  it('does not relabel a former 80–90% prediction as the current 20% option', () => {
    expect(previousPredictionText(step, 2, 'd')).toBe('약 80~90%');
    expect(previousPredictionText(step, 2, 'd')).not.toBe('약 20% 안팎');
  });
  it('keeps the first 20–35% estimate when the next stage reuses b for 30%', () => {
    expect(previousPredictionText(step, 1, 'b')).toBe('약 20~35% 정도');
  });
  it('does not invent a previous judgment before the first stage or for an unknown answer', () => {
    expect(previousPredictionText(step, 0, 'a')).toBeNull();
    expect(previousPredictionText(step, 1, 'missing')).toBeNull();
  });
});

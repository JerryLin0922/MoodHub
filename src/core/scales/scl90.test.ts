import { describe, expect, it } from 'vitest';
import {
  SCL90_ITEMS,
  SCL90_FACTORS,
  SCL90_EXTRA_ITEMS,
  scoreSCL90,
} from './scl90';

/** Answers every item with the same score. */
function all(score: number): Record<number, number> {
  return Object.fromEntries(SCL90_ITEMS.map((_, i) => [i, score]));
}

describe('scoreSCL90', () => {
  it('has exactly 90 items and 9 factors plus 7 extra items', () => {
    expect(SCL90_ITEMS).toHaveLength(90);
    expect(SCL90_FACTORS).toHaveLength(9);
    expect(SCL90_EXTRA_ITEMS).toHaveLength(7);
  });

  it('factors and extra items cover every 1-based item exactly once', () => {
    const covered = new Set<number>();
    for (const f of SCL90_FACTORS) {
      f.items.forEach(n => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(90);
        expect(covered.has(n)).toBe(false);
        covered.add(n);
      });
    }
    SCL90_EXTRA_ITEMS.forEach(n => {
      expect(covered.has(n)).toBe(false);
      covered.add(n);
    });
    expect(covered.size).toBe(90);
  });

  it('scores a healthy all-1 profile as negative', () => {
    const r = scoreSCL90(all(1));
    expect(r.total).toBe(90);
    expect(r.mean).toBe(1);
    expect(r.positiveCount).toBe(0);
    expect(r.positiveMean).toBe(0);
    expect(r.screenPositive).toBe(false);
    expect(r.crisisItems).toEqual([]);
    expect(r.factorScores.every(f => f.score === 1 && !f.elevated)).toBe(true);
  });

  it('flags an elevated factor as a positive screen', () => {
    const answers = all(1);
    // Depression factor: 5,14,15,20,22,26,29,30,31,32,54,71,79 (1-based).
    [5, 14, 15, 20, 22, 26, 29, 30, 31, 32, 54, 71, 79].forEach(n => {
      answers[n - 1] = 2;
    });
    const r = scoreSCL90(answers);
    const dep = r.factorScores.find(f => f.id === 'depression')!;
    expect(dep.score).toBe(2);
    expect(dep.elevated).toBe(true);
    expect(r.screenPositive).toBe(true);
  });

  it('raises a crisis warning when item 15 is scored >= 2', () => {
    const answers = all(1);
    answers[14] = 2; // 想结束自己的生命
    const r = scoreSCL90(answers);
    expect(r.crisisItems).toContain(15);
  });

  it('does not raise a crisis warning on item 15 score 1', () => {
    const r = scoreSCL90(all(1));
    expect(r.crisisItems).not.toContain(15);
  });

  it('flags positive screen when total >= 160', () => {
    const answers = all(2);
    expect(scoreSCL90(answers).total).toBe(180);
    expect(scoreSCL90(answers).screenPositive).toBe(true);
  });

  it('flags positive screen when >= 43 positive items', () => {
    const answers = all(1);
    for (let i = 0; i < 43; i++) answers[i] = 2;
    const r = scoreSCL90(answers);
    expect(r.positiveCount).toBe(43);
    expect(r.screenPositive).toBe(true);
  });

  it('handles partially answered profiles without NaN', () => {
    const r = scoreSCL90({ 0: 1, 1: 2, 89: 5 });
    expect(r.total).toBe(8);
    expect(r.mean).toBeCloseTo(8 / 3);
    expect(r.factorScores.every(f => Number.isFinite(f.score))).toBe(true);
    expect(r.positiveMean).toBeCloseTo((2 + 5) / 2);
  });

  it('computes positive mean only from items >= 2', () => {
    const answers = all(3);
    const r = scoreSCL90(answers);
    expect(r.positiveCount).toBe(90);
    expect(r.positiveMean).toBe(3);
  });
});

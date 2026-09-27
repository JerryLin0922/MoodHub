import { describe, expect, it } from 'vitest';
import type { HealthSample } from './types';
import { aggregateDaily } from './aggregate';

function s(date: string, type: HealthSample['type'], value: number, id: string): HealthSample {
  return { id, ts: `${date}T00:00:00`, date, type, value, unit: '', source: 'csv' };
}

describe('aggregateDaily', () => {
  it('averages continuous metrics and sums steps', () => {
    const samples: HealthSample[] = [
      s('2026-09-01', 'sleep_duration', 360, '1'),
      s('2026-09-01', 'sleep_duration', 420, '2'),
      s('2026-09-01', 'steps', 1000, '3'),
      s('2026-09-01', 'steps', 500, '4'),
    ];
    const out = aggregateDaily(samples);
    expect(out).toHaveLength(1);
    expect(out[0].sleepDuration).toBe(390);
    expect(out[0].steps).toBe(1500);
  });

  it('sorts by date ascending', () => {
    const samples: HealthSample[] = [
      s('2026-09-02', 'steps', 1, '2'),
      s('2026-09-01', 'steps', 2, '1'),
    ];
    const out = aggregateDaily(samples);
    expect(out.map(d => d.date)).toEqual(['2026-09-01', '2026-09-02']);
  });

  it('returns an empty array for no data', () => {
    expect(aggregateDaily([])).toEqual([]);
  });
});

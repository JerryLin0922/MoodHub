import { describe, expect, it } from 'vitest';
import { parseCSV } from './csv';

describe('parseCSV', () => {
  it('parses date + metric columns', () => {
    const text = '日期,睡眠时长,静息心率\n2026-09-01,420,62\n2026-09-02,390,61';
    const res = parseCSV(text);
    expect(res.samples).toHaveLength(4);
    expect(res.columns.map(c => c.type)).toEqual([
      'sleep_duration',
      'resting_heart_rate',
    ]);
  });

  it('converts hours to minutes when the header says hours', () => {
    const text = 'date,sleep duration(h)\n2026-09-01,7.5';
    const res = parseCSV(text);
    expect(res.samples[0].type).toBe('sleep_duration');
    expect(res.samples[0].value).toBe(450);
  });

  it('handles quoted fields and UTF-8 BOM', () => {
    const text = '\uFEFF日期,备注,压力\n2026-09-01,"hello, world",30';
    const res = parseCSV(text);
    expect(res.samples).toHaveLength(1);
    expect(res.samples[0].value).toBe(30);
  });

  it('throws on empty or header-only input', () => {
    expect(() => parseCSV('')).toThrow();
    expect(() => parseCSV('只有表头没有数据')).toThrow();
  });
});

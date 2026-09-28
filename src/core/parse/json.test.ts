import { describe, expect, it } from 'vitest';
import { parseJSON } from './json';

describe('parseJSON', () => {
  it('parses normalized rows with aliases and unit conversion', () => {
    const text = JSON.stringify([
      { ts: '2026-09-01T08:00:00', type: 'sleep_hours', value: 7.5 },
      { time: '2026-09-01 12:00', metric: 'rhr', value: 61 },
    ]);
    const res = parseJSON(text);
    expect(res.samples).toHaveLength(2);
    expect(res.samples[0].type).toBe('sleep_duration');
    expect(res.samples[0].value).toBe(450);
    expect(res.samples[1].type).toBe('resting_heart_rate');
  });

  it('skips malformed rows instead of crashing', () => {
    const text = JSON.stringify([
      null,
      42,
      { ts: '2026-09-01', type: 'steps', value: 100 },
      'x',
    ]);
    const res = parseJSON(text);
    expect(res.samples).toHaveLength(1);
    expect(res.samples[0].value).toBe(100);
  });

  it('reports unknown types and invalid JSON with readable errors', () => {
    expect(() =>
      parseJSON('[{"ts":"2026-09-01","type":"bogus","value":1}]')
    ).toThrow(/未识别/);
    expect(() => parseJSON('not json')).toThrow(/JSON 解析失败/);
  });

  it('rejects non-array top level', () => {
    expect(() => parseJSON('{"a":1}')).toThrow(/顶层必须是数组/);
  });
});

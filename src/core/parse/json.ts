import type { HealthMetricType, HealthSample, HealthSource } from '../types';
import { uid } from '../utils';
import { normalizeTs, type ParseResult } from './csv';

/**
 * Accepted aliases for the `type` / `metric` field.
 * Anything not in this map is dropped so that aggregateDaily() never
 * silently ignores data (a frequent source of "imported but chart is empty").
 */
const TYPE_ALIAS: Record<string, HealthMetricType> = {
  sleep_duration:      'sleep_duration',
  sleep_minutes:       'sleep_duration',
  sleep_hours:         'sleep_duration',
  sleep_time:          'sleep_duration',
  total_sleep:         'sleep_duration',

  sleep_efficiency:    'sleep_efficiency',

  resting_heart_rate:  'resting_heart_rate',
  rhr:                 'resting_heart_rate',
  resting_hr:          'resting_heart_rate',

  heart_rate:          'heart_rate',
  hr:                  'heart_rate',

  hrv:                 'hrv',
  heart_rate_variability: 'hrv',

  spo2:                'spo2',
  blood_oxygen:        'spo2',

  stress:              'stress',

  steps:               'steps',
  step_count:          'steps',

  exercise_minutes:    'exercise_minutes',
  exercise:            'exercise_minutes',
  active_minutes:      'exercise_minutes',
};

/**
 * Accepts two JSON shapes:
 *   1) Normalized: [{ ts, type, value, unit? }]
 *   2) Generic:    [{ time, metric, value }]
 */
export function parseJSON(text: string, source: HealthSource = 'json'): ParseResult {
  let arr: unknown;
  try {
    arr = JSON.parse(text);
  } catch (e) {
    throw new Error(`JSON 解析失败：${e instanceof Error ? e.message : String(e)}`);
  }
  if (!Array.isArray(arr)) throw new Error('JSON 顶层必须是数组');

  const samples: HealthSample[] = [];
  const skipped: string[] = [];

  for (const item of arr) {
    // Guard against null / primitive / malformed rows.
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;

    const ts = normalizeTs(
      (rec.ts ?? rec.time ?? rec.startTime ?? rec.date) as string | undefined
    );
    if (!ts) continue;

    const rawType = String(rec.type ?? rec.metric ?? '').toLowerCase().trim();
    const type = TYPE_ALIAS[rawType];
    if (!type) {
      if (rawType && !skipped.includes(rawType)) skipped.push(rawType);
      continue;
    }

    let value = Number(rec.value);
    if (!isFinite(value)) continue;

    // Convert hours to minutes when the alias or unit implies hours.
    if (
      type === 'sleep_duration' &&
      (rawType === 'sleep_hours' || /hour|小时/i.test(String(rec.unit ?? '')))
    ) {
      value *= 60;
    }

    samples.push({
      id: uid(),
      ts,
      date: ts.slice(0, 10),
      type,
      value,
      unit: String(rec.unit ?? ''),
      source: (rec.source as HealthSource) ?? source,
    });
  }

  if (!samples.length) {
    const hint = skipped.length ? `（未识别的类型：${skipped.join(', ')}）` : '';
    throw new Error(`未解析到任何有效记录${hint}`);
  }

  return { samples, columns: [] };
}

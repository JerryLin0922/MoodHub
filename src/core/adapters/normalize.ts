import type {
  HealthMetricType,
  HealthSample,
  HealthSource,
} from '../types';
import type { RawMetric } from './types';

/** 各指标的标准单位（RawMetric 未显式给 unit 时的兜底） */
const UNIT_BY_METRIC: Record<HealthMetricType, string> = {
  sleep_duration: 'minutes',
  sleep_efficiency: '%',
  resting_heart_rate: 'bpm',
  heart_rate: 'bpm',
  hrv: 'ms',
  spo2: '%',
  stress: '',
  steps: 'count',
  exercise_minutes: 'minutes',
};

let seq = 0;
export function nextSampleId(source: HealthSource): string {
  seq += 1;
  return `${source}_${Date.now().toString(36)}_${seq}`;
}

export function toLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 本地时区 ISO 字符串（不带 Z），与既有 HealthSample.ts 的 ts 语义一致 */
export function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** 指标合理性校验；不合法返回 null */
function sanity(type: HealthMetricType, value: number): number | null {
  if (!Number.isFinite(value)) return null;
  switch (type) {
    case 'steps':
    case 'sleep_duration':
    case 'exercise_minutes':
      return value >= 0 ? Math.round(value) : null;
    case 'heart_rate':
    case 'resting_heart_rate':
      return value > 0 && value < 300 ? Math.round(value) : null;
    case 'hrv':
      return value > 0 && value < 1000 ? value : null;
    case 'spo2':
      return value > 0 && value <= 100 ? value : null;
    case 'stress':
      return value >= 0 && value <= 100 ? Math.round(value) : null;
    case 'sleep_efficiency':
      return value >= 0 && value <= 100 ? value : null;
    default:
      return value;
  }
}

/** 归一化单条原始记录 → HealthSample；不合法返回 null */
export function normalizeOne(raw: RawMetric): HealthSample | null {
  const value = sanity(raw.metric, raw.value);
  if (value === null) return null;

  const start = new Date(raw.startAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = raw.endAt ? new Date(raw.endAt) : start;
  if (Number.isNaN(end.getTime())) return null;

  // 样本时间点取区间中点，日聚合时落在合理位置
  const ts = new Date((start.getTime() + end.getTime()) / 2);

  return {
    id: nextSampleId(raw.source),
    ts: toLocalISO(ts),
    date: toLocalDate(ts),
    type: raw.metric,
    value,
    unit: raw.unit || UNIT_BY_METRIC[raw.metric],
    source: raw.source,
  };
}

export function normalizeMany(
  raws: RawMetric[]
): { samples: HealthSample[]; skipped: number } {
  const samples: HealthSample[] = [];
  let skipped = 0;
  for (const raw of raws) {
    const s = normalizeOne(raw);
    if (s) samples.push(s);
    else skipped += 1;
  }
  return { samples, skipped };
}

/**
 * 按 date+type 去重，保留最后一条。
 * 适用于 steps 这类「日累计值」的幂等合并；瞬时值（心率等）请关闭。
 */
export function dedupeByDay(samples: HealthSample[]): HealthSample[] {
  const map = new Map<string, HealthSample>();
  for (const s of samples) {
    map.set(`${s.date}|${s.type}`, s);
  }
  return [...map.values()];
}

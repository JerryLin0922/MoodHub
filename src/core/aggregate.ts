import type { DailyAggregate, HealthSample } from './types';

/** Metrics that are averaged across multiple samples in the same day. */
const AVERAGED: (keyof DailyAggregate)[] = [
  'sleepDuration',
  'sleepEfficiency',
  'restingHeartRate',
  'heartRate',
  'hrv',
  'stress',
  'spo2',
];

/**
 * Group raw samples by date.
 * - Averaged metrics (sleep / heart rate / HRV / stress / SpO2) → mean across the day.
 * - Summed metrics (steps / exercise minutes) → sum across the day.
 */
export function aggregateDaily(samples: HealthSample[]): DailyAggregate[] {
  // Collect arrays of values per date + metric.
  const buckets = new Map<string, Partial<Record<keyof DailyAggregate, number[]>>>();
  const sums = new Map<string, { steps: number; exercise: number }>();

  const pushAvg = (date: string, key: keyof DailyAggregate, value: number) => {
    if (!buckets.has(date)) buckets.set(date, {});
    const b = buckets.get(date)!;
    (b[key] ??= []).push(value);
  };

  for (const s of samples) {
    switch (s.type) {
      case 'sleep_duration':      pushAvg(s.date, 'sleepDuration', s.value); break;
      case 'sleep_efficiency':    pushAvg(s.date, 'sleepEfficiency', s.value); break;
      case 'resting_heart_rate':  pushAvg(s.date, 'restingHeartRate', s.value); break;
      case 'heart_rate':          pushAvg(s.date, 'heartRate', s.value); break;
      case 'hrv':                 pushAvg(s.date, 'hrv', s.value); break;
      case 'stress':              pushAvg(s.date, 'stress', s.value); break;
      case 'spo2':                pushAvg(s.date, 'spo2', s.value); break;
      case 'steps': {
        const cur = sums.get(s.date) ?? { steps: 0, exercise: 0 };
        cur.steps += s.value;
        sums.set(s.date, cur);
        break;
      }
      case 'exercise_minutes': {
        const cur = sums.get(s.date) ?? { steps: 0, exercise: 0 };
        cur.exercise += s.value;
        sums.set(s.date, cur);
        break;
      }
    }
  }

  const dates = new Set<string>([...buckets.keys(), ...sums.keys()]);
  const out: DailyAggregate[] = [];

  for (const date of dates) {
    const day: DailyAggregate = { date };
    const b = buckets.get(date);
    if (b) {
      for (const key of AVERAGED) {
        const arr = b[key];
        if (arr && arr.length) {
          (day as any)[key] = arr.reduce((a, x) => a + x, 0) / arr.length;
        }
      }
    }
    const s = sums.get(date);
    if (s) {
      if (s.steps > 0) day.steps = s.steps;
      if (s.exercise > 0) day.exerciseMinutes = s.exercise;
    }
    out.push(day);
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

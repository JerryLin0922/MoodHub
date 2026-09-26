import type { DailyAggregate, HealthSample, MoodEntry } from '../core/types';

/**
 * Local-first data API.
 * Data lives in localStorage via storage.ts; these helpers provide
 * derived data and export/backup utilities. Nothing leaves the device.
 */

/** Download a JSON backup of all user data. */
export function exportBackup(
  samples: HealthSample[],
  moods: MoodEntry[],
  chat: unknown[]
): void {
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date().toISOString(), samples, moods, chat }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moodhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Merge a backup payload into current arrays (dedup by sample id). */
export function mergeBackup(
  current: { samples: HealthSample[]; moods: MoodEntry[] },
  backup: { samples?: HealthSample[]; moods?: MoodEntry[] }
): { samples: HealthSample[]; moods: MoodEntry[] } {
  const seen = new Set(current.samples.map(s => s.id));
  const samples = [
    ...current.samples,
    ...(backup.samples ?? []).filter(s => !seen.has(s.id)),
  ];

  const moodMap = new Map(current.moods.map(m => [m.date, m]));
  for (const m of backup.moods ?? []) moodMap.set(m.date, m);

  return { samples, moods: [...moodMap.values()] };
}

/** Range summary used by the overview cards. */
export function summarize(daily: DailyAggregate[]) {
  const last = daily[daily.length - 1];
  const week = daily.slice(-7);
  const avg = (k: keyof DailyAggregate) => {
    const vals = week
      .map(d => d[k])
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  return {
    today: last ?? null,
    weekAvgSleep: avg('sleepDuration'),
    weekAvgRhr: avg('restingHeartRate'),
    weekAvgHrv: avg('hrv'),
    weekAvgStress: avg('stress'),
  };
}

/**
 * 数据导出辅助（对应 ROADMAP-2026 阶段一"数据导出"）。
 * 全部在本机生成 Blob 下载，不上传任何服务器。
 */
import type { AISettings, ChatMessage, HealthSample, MoodEntry } from './types';

export function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function moodsToCSV(moods: MoodEntry[]): string {
  const head = ['date', 'mood', 'stress', 'sleepQuality', 'note', 'updatedAt'];
  const rows = moods.map(m =>
    [m.date, m.mood, m.stress, m.sleepQuality, csvEscape(m.note ?? ''), m.updatedAt].join(',')
  );
  return [head.join(','), ...rows].join('\n');
}

export function samplesToCSV(samples: HealthSample[]): string {
  const head = ['date', 'ts', 'type', 'value', 'unit', 'source'];
  const rows = samples.map(s =>
    [s.date, s.ts, s.type, s.value, csvEscape(s.unit), s.source].join(',')
  );
  return [head.join(','), ...rows].join('\n');
}

export interface ExportBundle {
  app: string;
  version: string;
  exportedAt: string;
  samples: HealthSample[];
  moods: MoodEntry[];
  chat: ChatMessage[];
  ai: Pick<AISettings, 'enabled' | 'providerId' | 'model'>;
}

export function buildExportBundle(opts: {
  samples: HealthSample[];
  moods: MoodEntry[];
  chat: ChatMessage[];
  ai: AISettings;
}): ExportBundle {
  const { samples, moods, chat, ai } = opts;
  return {
    app: 'MoodHub',
    version: '0.2.0',
    exportedAt: new Date().toISOString(),
    samples,
    moods,
    chat,
    ai: { enabled: ai.enabled, providerId: ai.providerId, model: ai.model },
  };
}

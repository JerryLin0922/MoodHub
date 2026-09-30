/**
 * Daylio 心情日记 CSV 解析（导入来源模板之一）。
 * 输出 MoodEntry（按日期 upsert），供导入引导预览与确认后写入。
 */
import type { MoodEntry } from '../types';
import { parseDelimited, normalizeTs } from './csv';

/** Daylio 心情文本 → 1-5 分（宽松匹配，兼容多语言）。 */
const MOOD_RULES: [RegExp, number][] = [
  [/awful|terrible|horrible|糟糕|超差|很差/i, 1],
  [/bad|poor|rough|差|不佳/i, 2],
  [/meh|okay|fine|ok|一般|还行|平平/i, 3],
  [/good|great|nice|好|不错/i, 4],
  [/rad|amazing|awesome|greatest|超好|很棒|很好|开心/i, 5],
];

export interface DaylioParseResult {
  moods: MoodEntry[];
  skipped: number;
}

export function parseDaylio(text: string): DaylioParseResult {
  const rows = parseDelimited(text.trim());
  if (rows.length < 2) throw new Error('Daylio 文件为空或只有表头');

  const headers = rows[0].map(h => h.trim());
  const dateIdx = headers.findIndex(h => /full_date|date|日期/i.test(h));
  if (dateIdx < 0) throw new Error('未找到日期列（full_date / date）');

  const moodIdx = headers.findIndex(h => /mood|心情|情绪/i.test(h));
  if (moodIdx < 0) throw new Error('未找到心情列（mood）');

  const noteIdx = headers.findIndex(h => /note|备注|日记/i.test(h));
  const titleIdx = headers.findIndex(h => /title|标题/i.test(h));

  const moods: MoodEntry[] = [];
  let skipped = 0;

  for (let r = 1; r < rows.length; r++) {
    const ts = normalizeTs(rows[r][dateIdx]);
    if (!ts) continue;
    const date = ts.slice(0, 10);

    const moodText = String(rows[r][moodIdx] ?? '');
    const rule = MOOD_RULES.find(([re]) => re.test(moodText));
    if (!rule) {
      skipped += 1;
      continue;
    }

    const noteParts = [rows[r][titleIdx], rows[r][noteIdx]]
      .map(v => (v == null ? '' : String(v).trim()))
      .filter(Boolean);
    const note = noteParts.join(' — ');

    moods.push({
      date,
      mood: rule[1],
      stress: 1,
      sleepQuality: 3,
      note,
      updatedAt: new Date().toISOString(),
    });
  }

  if (!moods.length) {
    throw new Error('未解析到任何有效心情记录（请确认 mood 列内容为 awful / bad / meh / good / rad 等）');
  }

  return { moods, skipped };
}

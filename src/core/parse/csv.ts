import type { HealthMetricType, HealthSample, HealthSource } from '../types';
import { pad, uid } from '../utils';

interface MetricRule {
  type: HealthMetricType;
  re: RegExp;
  unit: string;
}

/**
 * Order defines priority.
 * HRV MUST be matched before heart_rate: "heart rate variability" contains
 * the substring "heart rate" and would otherwise be captured by the wrong rule.
 * Resting heart rate MUST come before heart rate for the same reason.
 */
const METRIC_RULES: MetricRule[] = [
  {
    type: 'resting_heart_rate',
    re: /静息心率|resting[\s_-]*heart|rhr/i,
    unit: 'bpm',
  },
  {
    type: 'hrv',
    re: /hrv|心率变异性|heart[\s_-]*rate[\s_-]*var(?:iability)?/i,
    unit: 'ms',
  },
  {
    // Negative lookahead prevents matching "heart rate variability".
    type: 'heart_rate',
    re: /心率(?!变异性)|heart[\s_-]*rate(?![\s_-]*var)/i,
    unit: 'bpm',
  },
  { type: 'spo2',             re: /血氧|spo2|blood[\s_-]*oxygen|oxygen[\s_-]*saturation/i,               unit: '%' },
  { type: 'sleep_efficiency', re: /睡眠效率|sleep[\s_-]*efficiency/i,                                    unit: '%' },
  { type: 'sleep_duration',   re: /睡眠时长|睡眠时间|sleep[\s_-]*(duration|time|analysis)|total[\s_-]*sleep|in[\s_-]*bed/i, unit: 'min' },
  { type: 'stress',           re: /压力|stress/i,                                                        unit: 'score' },
  { type: 'steps',            re: /步数|steps|step[\s_-]*count/i,                                        unit: '步' },
  { type: 'exercise_minutes', re: /运动时长|锻炼时长|exercise|active[\s_-]*min/i,                        unit: 'min' },
];

export interface ParseResult {
  samples: HealthSample[];
  columns: { header: string; type: HealthMetricType }[];
}

/** Strip a UTF-8 BOM if present. */
function stripBOM(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Detect the delimiter used by the header row. */
function detectDelimiter(headerLine: string): string {
  if (headerLine.includes('\t')) return '\t';
  if (headerLine.includes(';')) return ';';
  return ',';
}

/** CSV parser supporting comma / tab / semicolon delimiters and quoted fields. */
export function parseDelimited(text: string): string[][] {
  const clean = stripBOM(text);
  const firstLine = clean.split('\n')[0] ?? '';
  const delim = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];

    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      field = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else if (c !== '\r') {
      field += c;
    }
  }

  row.push(field);
  if (row.some(v => v.trim() !== '')) rows.push(row);
  return rows;
}

/** Normalize many timestamp formats into a single ISO string. */
export function normalizeTs(s: string | undefined | null): string | null {
  if (!s) return null;
  const str = String(s).trim();

  const m = str.match(
    /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );
  if (m) {
    const [, y, mo, d, h = '0', mi = '0', sec = '0'] = m;
    return `${y}-${pad(+mo)}-${pad(+d)}T${pad(+h)}:${pad(+mi)}:${pad(+sec)}`;
  }

  const dt = new Date(str);
  if (isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T00:00:00`;
}

export function parseCSV(text: string, source: HealthSource = 'csv'): ParseResult {
  const rows = parseDelimited(text.trim());
  if (rows.length < 2) throw new Error('文件为空或只有表头');

  const headers = rows[0].map(h => h.trim());
  const tsIdx = headers.findIndex(h =>
    /时间|日期|timestamp|time|date|datetime/i.test(h)
  );
  if (tsIdx < 0) throw new Error('未找到时间列（时间 / 日期 / timestamp / date）');

  const columns: ParseResult['columns'] = [];
  const colIdx: { idx: number; type: HealthMetricType; unit: string; header: string }[] = [];

  headers.forEach((h, i) => {
    if (i === tsIdx) return;
    const rule = METRIC_RULES.find(r => r.re.test(h));
    if (rule) {
      columns.push({ header: h, type: rule.type });
      colIdx.push({ idx: i, type: rule.type, unit: rule.unit, header: h });
    }
  });

  if (!columns.length) {
    // 长表模式（Apple 健康 / 可穿戴设备导出）：表头含 type + value 列，
    // 指标类型写在行值里（如 HKQuantityTypeIdentifierSleepAnalysis）。
    const samples: HealthSample[] = [];
    const typeIdx = headers.findIndex(h => /type|类型|kind|指标/i.test(h));
    const valueIdx = headers.findIndex(h => /value|数值|值/i.test(h));
    if (typeIdx < 0 || valueIdx < 0) {
      throw new Error('未识别到任何健康指标列');
    }

    for (let r = 1; r < rows.length; r++) {
      const ts = normalizeTs(rows[r][tsIdx]);
      if (!ts) continue;

      const typeName = String(rows[r][typeIdx] ?? '');
      const rule = METRIC_RULES.find(x => x.re.test(typeName));
      if (!rule) continue;

      const raw = rows[r][valueIdx];
      if (raw == null || String(raw).trim() === '') continue;
      let v = parseFloat(String(raw).replace(/[^\d.\-]/g, ''));
      if (!isFinite(v)) continue;

      // 长表模式下睡眠时长按分钟计（Apple 导出），仅当单位列显式提示小时才转换。
      const unitText = String(rows[r][valueIdx + 1] ?? '') + ' ' + typeName;
      if (rule.type === 'sleep_duration' && /小时|hours?|\(h\)/i.test(unitText)) {
        v *= 60;
      }

      samples.push({
        id: uid(),
        ts,
        date: ts.slice(0, 10),
        type: rule.type,
        value: v,
        unit: rule.unit,
        source,
      });
    }

    if (!samples.length) throw new Error('未识别到任何健康指标列');
    return { samples, columns };
  }

  const samples: HealthSample[] = [];

  for (let r = 1; r < rows.length; r++) {
    const ts = normalizeTs(rows[r][tsIdx]);
    if (!ts) continue;

    for (const c of colIdx) {
      const raw = rows[r][c.idx];
      if (raw == null || String(raw).trim() === '') continue;

      let v = parseFloat(String(raw).replace(/[^\d.\-]/g, ''));
      if (!isFinite(v)) continue;

      // Sleep duration: convert hours to minutes. The header must explicitly
      // say "hour" / "小时" / "(h)" — we deliberately do NOT match a bare "h".
      if (c.type === 'sleep_duration' && /小时|hours?|\(h\)|单位[:\s]*h/i.test(c.header)) {
        v *= 60;
      }

      samples.push({
        id: uid(),
        ts,
        date: ts.slice(0, 10),
        type: c.type,
        value: v,
        unit: c.unit,
        source,
      });
    }
  }

  return { samples, columns };
}

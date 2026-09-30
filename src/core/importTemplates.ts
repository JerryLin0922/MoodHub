/**
 * 导入来源模板（ImportGuide，对应 ROADMAP-2026 阶段一 / FEEDBACK FB-2026-09-02）。
 *
 * 每个模板提供：
 * - where：数据从哪里来（解决"怎么导、从哪来"的核心困惑）；
 * - sample：与解析器兼容的示例文本，一键填入即可体验完整导入流程。
 *
 * 示例文本与 src/core/parse/csv.ts（宽表 + type/value 长表）及
 * src/core/parse/json.ts、src/core/parse/daylio.ts 保持兼容。
 */

export interface ImportTemplate {
  id: string;
  name: string;
  icon: string;
  format: 'csv' | 'json';
  description: string;
  where: string;
  sample: string;
}

/** Apple 健康导出（type + startDate + value 长表结构）。 */
export const APPLE_SAMPLE = [
  'type,startDate,endDate,value,unit',
  'HKQuantityTypeIdentifierSleepAnalysis,2026-09-28 23:30:00,2026-09-29 07:10:00,460,min',
  'HKQuantityTypeIdentifierRestingHeartRate,2026-09-29 08:00:00,2026-09-29 08:00:00,61,bpm',
  'HKQuantityTypeIdentifierHeartRateVariability,2026-09-29 08:00:00,2026-09-29 08:00:00,42,ms',
  'HKQuantityTypeIdentifierStepCount,2026-09-29 00:00:00,2026-09-29 23:59:00,8421,count',
  'HKQuantityTypeIdentifierOxygenSaturation,2026-09-29 08:00:00,2026-09-29 08:00:00,98,%',
  'HKQuantityTypeIdentifierHeartRate,2026-09-29 08:05:00,2026-09-29 08:05:00,72,bpm',
].join('\n');

/** 华为运动健康导出（宽表：日期 + 指标列）。 */
export const HUAWEI_SAMPLE = [
  '日期,睡眠时长(小时),静息心率,压力,步数,血氧',
  '2026-09-27,7.1,63,41,8032,97',
  '2026-09-28,7.5,62,38,9203,98',
  '2026-09-29,6.8,61,45,7832,97',
].join('\n');

/** Google Fit 导出（宽表：date + 指标列）。 */
export const GOOGLE_SAMPLE = [
  'date,sleep_duration,resting_heart_rate,hrv,steps',
  '2026-09-27,426,63,40,8032',
  '2026-09-28,450,62,42,8421',
  '2026-09-29,408,61,38,7832',
].join('\n');

/** 通用 JSON（[{ ts, type, value, unit? }]）。 */
export const GENERIC_JSON_SAMPLE = JSON.stringify(
  [
    { ts: '2026-09-28T00:00:00', type: 'sleep_duration', value: 450, unit: 'min' },
    { ts: '2026-09-28T00:00:00', type: 'resting_heart_rate', value: 62, unit: 'bpm' },
    { ts: '2026-09-28T00:00:00', type: 'hrv', value: 42, unit: 'ms' },
    { ts: '2026-09-28T00:00:00', type: 'steps', value: 8421, unit: 'count' },
  ],
  null,
  2
);

/** Daylio 心情导出（会导入为 MoodEntry 心情记录）。 */
export const DAYLIO_SAMPLE = [
  'full_date,date,mood,activities,note_title,note',
  'September 27, 2026,2026-09-27,meh,"Work,Family","","普通的一天"',
  'September 28, 2026,2026-09-28,awful,"Work,Health","","今天很糟糕"',
  'September 29, 2026,2026-09-29,rad,"Friends,Hobby","","和朋友去了公园"',
].join('\n');

export const IMPORT_TEMPLATES: ImportTemplate[] = [
  {
    id: 'apple-health',
    name: 'Apple 健康',
    icon: '🍎',
    format: 'csv',
    description: 'iPhone 健康 App 导出的 CSV（type + 日期 + value 长表）',
    where: 'iPhone「健康」App → 右上角头像 → 导出所有健康数据 → 解压 zip，选择 CSV 文件上传',
    sample: APPLE_SAMPLE,
  },
  {
    id: 'huawei-health',
    name: '华为运动健康',
    icon: '⌚',
    format: 'csv',
    description: '华为运动健康导出的宽表 CSV（日期 + 指标列）',
    where: '华为运动健康 App → 我的 → 设置 → 数据导出，得到 CSV 后上传',
    sample: HUAWEI_SAMPLE,
  },
  {
    id: 'google-fit',
    name: 'Google Fit',
    icon: '📈',
    format: 'csv',
    description: 'Google Fit 导出（睡眠 / 心率 / HRV / 步数宽表）',
    where: 'Google 导出中心 takeout.google.com → 选择 Google Fit 数据导出 CSV 后上传',
    sample: GOOGLE_SAMPLE,
  },
  {
    id: 'daylio',
    name: 'Daylio 心情',
    icon: '📔',
    format: 'csv',
    description: 'Daylio 心情日记导出 CSV（会导入为心情记录）',
    where: 'Daylio App → 菜单 → 导出数据（CSV），下载后上传',
    sample: DAYLIO_SAMPLE,
  },
  {
    id: 'generic-json',
    name: '通用 JSON',
    icon: '🧩',
    format: 'json',
    description: '[{ ts, type, value, unit? }] 结构，适合自定义导出',
    where: '任何能导出 JSON 的健康 / 可穿戴 App，按示例结构整理即可',
    sample: GENERIC_JSON_SAMPLE,
  },
];

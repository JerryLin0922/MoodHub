/**
 * Gameplay 游戏化模块（对应 ROADMAP-2026 阶段二 / FEEDBACK FB-2026-09-01）。
 *
 * - 快捷情绪按钮：心情 1-5 表情，点击即完成打卡（3 秒内）。
 * - streak 连续记录：今天未记录时从昨天起算，今天打卡即续上。
 * - 成就勋章：基于数据派生计算，不新增存储。
 * - 情绪花园：每次记录对应一朵情绪花，颜色按心情映射，连续记录解锁装饰。
 *
 * 全部为纯本地派生计算（数据驱动，删除记录后自动重新评估）。
 */
import type { MoodEntry } from './types';
import { fmtDate, today } from './utils';

/** 快捷情绪按钮的 Emoji（心情 1-5）。 */
export const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄'] as const;

/** 情绪花园的花色映射：心情 1-5 → 花瓣 / 花芯 / 名称。 */
export const MOOD_FLOWER = [
  { petal: '#9AA7B5', center: '#E2E8F0', label: '灰雨花' },
  { petal: '#7F9CB5', center: '#D3E0EC', label: '雾蓝花' },
  { petal: '#5FA8D3', center: '#D6EBF7', label: '晴空花' },
  { petal: '#7CB67D', center: '#E3F1E4', label: '新芽花' },
  { petal: '#F5A623', center: '#FDEBD3', label: '暖阳花' },
] as const;

export interface StreakInfo {
  /** 当前连续天数（今天未记录时从昨天起算）。 */
  current: number;
  /** 历史最长连续天数。 */
  longest: number;
  /** 今天是否已有记录。 */
  hasToday: boolean;
}

function toDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function dayDiff(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
}

export function computeStreak(moods: MoodEntry[]): StreakInfo {
  const dates = new Set(moods.map(m => m.date));
  const todayStr = today();
  const hasToday = dates.has(todayStr);

  let current = 0;
  const cursor = toDate(todayStr);
  if (!hasToday) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(fmtDate(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = [...dates].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && dayDiff(prev, d) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest, hasToday };
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  check: (moods: MoodEntry[], streak: StreakInfo) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: '初次记录', desc: '写下第一条心情日记', icon: '🌱', check: m => m.length >= 1 },
  { id: 'streak3', title: '三日之约', desc: '连续记录 3 天', icon: '🔥', check: (_m, s) => s.longest >= 3 },
  { id: 'streak7', title: '一周同行', desc: '连续记录 7 天', icon: '⭐', check: (_m, s) => s.longest >= 7 },
  { id: 'streak14', title: '半月守候', desc: '连续记录 14 天', icon: '🏆', check: (_m, s) => s.longest >= 14 },
  { id: 'total10', title: '点滴积累', desc: '累计记录 10 条', icon: '📒', check: m => m.length >= 10 },
  { id: 'total30', title: '三十而立', desc: '累计记录 30 条', icon: '📚', check: m => m.length >= 30 },
  { id: 'total100', title: '百日陪伴', desc: '累计记录 100 条', icon: '💎', check: m => m.length >= 100 },
];

export function evaluateAchievements(moods: MoodEntry[]): Achievement[] {
  const streak = computeStreak(moods);
  return ACHIEVEMENTS.filter(a => a.check(moods, streak));
}

/** 花园里程碑：达到该连续天数的那天会点缀星星装饰。 */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

/** 花园里某天是否属于 streak 里程碑（用于装饰）。 */
export function isMilestoneDay(date: string, moods: MoodEntry[]): boolean {
  const dates = new Set(moods.map(m => m.date));
  if (!dates.has(date)) return false;

  // 计算以 date 结尾的连续天数。
  let run = 1;
  const cursor = toDate(date);
  while (true) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(fmtDate(cursor))) break;
    run += 1;
  }
  return STREAK_MILESTONES.includes(run);
}

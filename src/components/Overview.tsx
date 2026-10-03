import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../store/AppContext';
import { usePrefs } from '../store/PrefsContext';
import type { DailyAggregate } from '../core/types';
import ScalePanel from './ScalePanel';

const METRIC_META: { key: keyof DailyAggregate; label: string; fmt: (v: number) => string }[] = [
  { key: 'sleepDuration',     label: '睡眠时长', fmt: v => `${(v / 60).toFixed(1)} 小时` },
  { key: 'restingHeartRate',  label: '静息心率', fmt: v => `${v.toFixed(0)} bpm` },
  { key: 'hrv',               label: 'HRV',      fmt: v => `${v.toFixed(0)} ms` },
  { key: 'stress',            label: '压力',     fmt: v => `${v.toFixed(0)} / 100` },
  { key: 'steps',             label: '步数',     fmt: v => v.toLocaleString() },
];

type SortKey = 'date' | keyof DailyAggregate;
type SortDir = 1 | -1;

export default function Overview() {
  const { daily, moods } = useApp();
  const { prefs } = usePrefs();

  // Sortable table state (设计规范: 数据表格支持排序).
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>(-1);
  // Privacy-mask reveal map: `${date}:${metricKey}` -> temporarily visible.
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const moodMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of moods) m.set(e.date, e.mood);
    return m;
  }, [moods]);

  const rows = useMemo(() => {
    return daily.slice(-14).map(d => ({
      ...d,
      date: d.date.slice(5),
      mood: moodMap.get(d.date),
    }));
  }, [daily, moodMap]);

  const hasMood = rows.some(r => r.mood != null);
  const chartData = rows.filter(r => r.sleepDuration != null || r.mood != null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(prev => (prev === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(key === 'date' ? -1 : 1);
    }
  }

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (sortKey === 'date') return a.date.localeCompare(b.date) * sortDir;
      const av = a[sortKey] as number | null | undefined;
      const bv = b[sortKey] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * sortDir;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  function peekCell(key: string, date: string) {
    if (!prefs.privacyMask) return true;
    return !!revealed[`${date}:${key}`];
  }

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
          最近 14 天总览
        </h2>

        {chartData.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">
            暂无数据。先去「导入」上传健康数据，或在「日记」记录心情。
          </p>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1890FF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1890FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={34} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sleepDuration"
                    stroke="#1890FF"
                    fill="url(#sleepGrad)"
                    strokeWidth={2}
                    name="睡眠(分钟)"
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#f59e0b"
                    fill="transparent"
                    strokeWidth={2}
                    name="心情(1-5)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {hasMood && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                橙色折线为心情（1–5），蓝色面积为睡眠时长（分钟）。
              </p>
            )}
          </>
        )}
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">指标明细</h2>
          {prefs.privacyMask && (
            <p className="text-xs text-slate-400 dark:text-slate-500">已开启隐私遮盖，点击数值可临时查看</p>
          )}
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">暂无记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-brand-600"
                      aria-label={`按日期排序${sortKey === 'date' ? (sortDir === 1 ? '（升序）' : '（降序）') : ''}`}
                    >
                      日期
                      <SortArrow on={sortKey === 'date'} dir={sortDir} />
                    </button>
                  </th>
                  {METRIC_META.map(m => (
                    <th key={m.key} className="py-2 px-3 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleSort(m.key)}
                        className="inline-flex items-center gap-1 hover:text-brand-600"
                        aria-label={`按${m.label}排序${sortKey === m.key ? (sortDir === 1 ? '（升序）' : '（降序）') : ''}`}
                      >
                        {m.label}
                        <SortArrow on={sortKey === m.key} dir={sortDir} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map(r => (
                  <tr key={r.date} className="border-b border-slate-50 dark:border-slate-700/50">
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{r.date}</td>
                    {METRIC_META.map(m => {
                      const v = r[m.key];
                      const moodV = m.key === 'sleepDuration' ? r.mood : null;
                      const show = peekCell(String(m.key), r.date);
                      const valueText = v != null ? m.fmt(v as number) : '';
                      return (
                        <td key={m.key} className="py-2 px-3 whitespace-nowrap">
                          {v != null ? (
                            <CellValue
                              visible={show}
                              onClick={() =>
                                setRevealed(prev => ({ ...prev, [`${r.date}:${String(m.key)}`]: !prev[`${r.date}:${String(m.key)}`] }))
                              }
                            >
                              {valueText}
                            </CellValue>
                          ) : m.key === 'sleepDuration' && moodV != null ? (
                            <CellValue
                              visible={show}
                              onClick={() =>
                                setRevealed(prev => ({ ...prev, [`${r.date}:mood`]: !prev[`${r.date}:mood`] }))
                              }
                              className="text-amber-600"
                            >
                              心情 {moodV}
                            </CellValue>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ScalePanel />
    </div>
  );
}

function SortArrow({ on, dir }: { on: boolean; dir: SortDir }) {
  return (
    <span className={on ? 'text-brand-600' : 'text-slate-300 dark:text-slate-600'} aria-hidden="true">
      {on ? (dir === 1 ? '↑' : '↓') : '↕'}
    </span>
  );
}

function CellValue({
  visible,
  onClick,
  children,
  className = '',
}: {
  visible: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={visible ? '点击遮盖' : '点击查看'}
      className={`inline-block text-left ${className}`}
    >
      {visible ? children : '••••'}
    </button>
  );
}

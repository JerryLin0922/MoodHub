import { useMemo } from 'react';
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
import type { DailyAggregate } from '../core/types';

const METRIC_META: { key: keyof DailyAggregate; label: string; fmt: (v: number) => string }[] = [
  { key: 'sleepDuration',     label: '睡眠时长', fmt: v => `${(v / 60).toFixed(1)} 小时` },
  { key: 'restingHeartRate',  label: '静息心率', fmt: v => `${v.toFixed(0)} bpm` },
  { key: 'hrv',               label: 'HRV',      fmt: v => `${v.toFixed(0)} ms` },
  { key: 'stress',            label: '压力',     fmt: v => `${v.toFixed(0)} / 100` },
  { key: 'steps',             label: '步数',     fmt: v => v.toLocaleString() },
];

export default function Overview() {
  const { daily, moods } = useApp();

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

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">最近 14 天总览</h2>

        {chartData.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            暂无数据。先去「导入」上传健康数据，或在「日记」记录心情。
          </p>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={34} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sleepDuration"
                    stroke="#6366f1"
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
              <p className="text-xs text-slate-400 mt-2">
                橙色折线为心情（1–5），紫色面积为睡眠时长（分钟）。
              </p>
            )}
          </>
        )}
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">指标明细</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">暂无记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-3 font-medium">日期</th>
                  {METRIC_META.map(m => (
                    <th key={m.key} className="py-2 px-3 font-medium whitespace-nowrap">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice()
                  .reverse()
                  .map(r => (
                    <tr key={r.date} className="border-b border-slate-50">
                      <td className="py-2 pr-3 whitespace-nowrap text-slate-600">{r.date}</td>
                      {METRIC_META.map(m => {
                        const v = r[m.key];
                        const moodV = m.key === 'sleepDuration' ? r.mood : null;
                        return (
                          <td key={m.key} className="py-2 px-3 whitespace-nowrap">
                            {v != null ? (
                              m.fmt(v as number)
                            ) : m.key === 'sleepDuration' && moodV != null ? (
                              <span className="text-amber-600">心情 {moodV}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
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
    </div>
  );
}

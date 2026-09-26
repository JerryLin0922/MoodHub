import { useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { parseCSV } from '../core/parse/csv';
import { parseJSON } from '../core/parse/json';
import { uid } from '../core/utils';
import type { HealthSample } from '../core/types';

type Mode = 'csv' | 'json' | 'manual';

interface ImportLog {
  ok: number;
  dropped: number;
  columns: string[];
}

export default function DataImport() {
  const { addSamples } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('csv');
  const [log, setLog] = useState<ImportLog | null>(null);
  const [error, setError] = useState('');

  /* Manual-entry state */
  const [mDate, setMDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mType, setMType] = useState('sleep_duration');
  const [mValue, setMValue] = useState('');
  const [mUnit, setMUnit] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    setLog(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();

    try {
      const res = mode === 'json' ? parseJSON(text) : parseCSV(text);
      addSamples(res.samples);
      setLog({
        ok: res.samples.length,
        dropped: 0,
        columns: res.columns.map(c => `${c.header} → ${c.type}`),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function submitManual() {
    setError('');
    setLog(null);
    const v = parseFloat(mValue);
    if (!mDate || isNaN(v)) {
      setError('请填写日期和有效数值');
      return;
    }
    const sample: HealthSample = {
      id: uid(),
      ts: `${mDate}T00:00:00`,
      date: mDate,
      type: mType as HealthSample['type'],
      value: v,
      unit: mUnit || '',
      source: 'manual',
    };
    addSamples([sample]);
    setLog({ ok: 1, dropped: 0, columns: [] });
    setMValue('');
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">导入模式</h2>
        <div className="flex gap-2">
          {(['csv', 'json', 'manual'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                'px-4 py-1.5 rounded-full text-sm transition-colors ' +
                (mode === m
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }
            >
              {m === 'csv' ? 'CSV' : m === 'json' ? 'JSON' : '手动添加'}
            </button>
          ))}
        </div>
      </section>

      {mode !== 'manual' && (
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            {mode === 'csv' ? '上传 CSV 文件' : '上传 JSON 文件'}
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            {mode === 'csv'
              ? '支持时间列 + 指标列。识别：睡眠时长/效率、静息心率、心率、HRV、血氧、压力、步数、运动时长。'
              : '支持 [{ ts, type, value }] 或 [{ time, metric, value }]，type 支持 sleep_hours/sleep_minutes/rhr/hr/hrv 等别名。'}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept={mode === 'csv' ? '.csv,text/csv' : '.json,application/json'}
            onChange={onFile}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:text-white file:px-4 file:py-2 file:text-sm hover:file:bg-slate-700"
          />
        </section>
      )}

      {mode === 'manual' && (
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">手动添加一条记录</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-500">
              日期
              <input
                type="date"
                value={mDate}
                onChange={e => setMDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-500">
              指标
              <select
                value={mType}
                onChange={e => setMType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="sleep_duration">睡眠时长（分钟）</option>
                <option value="sleep_efficiency">睡眠效率（%）</option>
                <option value="resting_heart_rate">静息心率（bpm）</option>
                <option value="heart_rate">心率（bpm）</option>
                <option value="hrv">HRV（ms）</option>
                <option value="spo2">血氧（%）</option>
                <option value="stress">压力（0-100）</option>
                <option value="steps">步数</option>
                <option value="exercise_minutes">运动时长（分钟）</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">
              数值
              <input
                type="number"
                value={mValue}
                onChange={e => setMValue(e.target.value)}
                placeholder="例如 480"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-500">
              单位（可选）
              <input
                type="text"
                value={mUnit}
                onChange={e => setMUnit(e.target.value)}
                placeholder="min / % / bpm"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            onClick={submitManual}
            className="mt-4 w-full rounded-full bg-slate-800 text-white py-2.5 text-sm hover:bg-slate-700"
          >
            添加记录
          </button>
        </section>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {log && (
        <div className="bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 text-sm">
          <p>成功导入 {log.ok} 条记录。</p>
          {log.columns.length > 0 && (
            <ul className="mt-1 text-xs list-disc pl-4">
              {log.columns.map(c => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

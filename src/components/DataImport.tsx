import { useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { parseCSV } from '../core/parse/csv';
import { parseJSON } from '../core/parse/json';
import { parseDaylio } from '../core/parse/daylio';
import { IMPORT_TEMPLATES, type ImportTemplate } from '../core/importTemplates';
import { uid } from '../core/utils';
import type { HealthSample, MoodEntry } from '../core/types';

/**
 * 导入引导（ImportGuide，对应 ROADMAP-2026 阶段一 / FEEDBACK FB-2026-09-02）。
 * 三步向导：1 选来源 → 2 上传/粘贴（含一键示例）→ 3 预览确认。
 * 空状态提供"数据从哪里来"说明，解决"怎么导、从哪来"的核心困惑。
 */

interface ImportLog {
  ok: number;
  dropped: number;
  columns: string[];
}

interface ParsedPreview {
  kind: 'health' | 'mood';
  count: number;
  columns: string[];
  samples?: HealthSample[];
  moods?: MoodEntry[];
  skipped: number;
}

export default function DataImport() {
  const { addSamples, importMoods } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [template, setTemplate] = useState<ImportTemplate | null>(null);
  const [paste, setPaste] = useState('');
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [error, setError] = useState('');
  const [log, setLog] = useState<ImportLog | null>(null);
  const [showWhere, setShowWhere] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  /* 手动添加（单条录入，保留原能力） */
  const [mDate, setMDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mType, setMType] = useState('sleep_duration');
  const [mValue, setMValue] = useState('');
  const [mUnit, setMUnit] = useState('');

  function startTemplate(t: ImportTemplate) {
    setTemplate(t);
    setPaste('');
    setPreview(null);
    setError('');
    setLog(null);
    setStep(2);
  }

  function fillSample() {
    if (template) setPaste(template.sample);
  }

  function parseInput(text: string) {
    setError('');
    setLog(null);
    if (!template) return;
    try {
      if (template.id === 'daylio') {
        const res = parseDaylio(text);
        setPreview({
          kind: 'mood',
          count: res.moods.length,
          columns: ['心情记录（按日期覆盖）'],
          moods: res.moods,
          skipped: res.skipped,
        });
      } else if (template.format === 'json') {
        const res = parseJSON(text);
        setPreview({
          kind: 'health',
          count: res.samples.length,
          columns: res.columns.map(c => `${c.header} → ${c.type}`),
          samples: res.samples,
          skipped: 0,
        });
      } else {
        const res = parseCSV(text);
        setPreview({
          kind: 'health',
          count: res.samples.length,
          columns: res.columns.length
            ? res.columns.map(c => `${c.header} → ${c.type}`)
            : ['自动识别指标类型（type/value 长表）'],
          samples: res.samples,
          skipped: 0,
        });
      }
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    parseInput(text);
    if (fileRef.current) fileRef.current.value = '';
  }

  function confirmImport() {
    if (!preview) return;
    if (preview.kind === 'health' && preview.samples) {
      addSamples(preview.samples);
    } else if (preview.kind === 'mood' && preview.moods) {
      importMoods(preview.moods);
    }
    setLog({ ok: preview.count, dropped: preview.skipped, columns: preview.columns });
    setPreview(null);
    setTemplate(null);
    setPaste('');
    setStep(1);
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

  const previewRows = preview?.kind === 'health'
    ? (preview.samples?.slice(0, 3) ?? [])
    : (preview?.moods?.slice(0, 3) ?? []);

  return (
    <div className="space-y-6">
      {step === 1 && !manualOpen && (
        <>
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">导入健康数据</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              选择数据来源，我们会引导你完成导入。所有数据仅保存在本机。
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="list" aria-label="数据来源">
              {IMPORT_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => startTemplate(t)}
                  className="text-left rounded-xl border border-slate-100 dark:border-slate-700 p-3 hover:border-brand-300 dark:hover:border-brand-700 transition-colors bg-slate-50/60 dark:bg-slate-700/40"
                >
                  <span className="block text-xl" aria-hidden="true">{t.icon}</span>
                  <span className="block text-sm font-medium mt-1">{t.name}</span>
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                    {t.description}
                  </span>
                  <span className="inline-block mt-2 rounded-full bg-slate-100 dark:bg-slate-600 px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-300">
                    {t.format === 'csv' ? 'CSV' : 'JSON'}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setManualOpen(true)}
                className="text-left rounded-xl border border-slate-100 dark:border-slate-700 p-3 hover:border-brand-300 dark:hover:border-brand-700 transition-colors bg-slate-50/60 dark:bg-slate-700/40"
              >
                <span className="block text-xl" aria-hidden="true">✍️</span>
                <span className="block text-sm font-medium mt-1">手动添加</span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                  单条录入，无需文件
                </span>
                <span className="inline-block mt-2 rounded-full bg-slate-100 dark:bg-slate-600 px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-300">
                  表单
                </span>
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setShowWhere(v => !v)}
              aria-expanded={showWhere}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">数据从哪里来？</span>
              <span className="text-xs text-slate-400">{showWhere ? '收起' : '展开'}</span>
            </button>
            {showWhere && (
              <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {IMPORT_TEMPLATES.map(t => (
                  <li key={t.id}>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{t.name}：</span>
                    {t.where}
                  </li>
                ))}
                <li className="text-slate-400 dark:text-slate-500">
                  提示：导入的数据仅用于在总览中展示趋势，不会被上传或分享。
                </li>
              </ul>
            )}
          </section>
        </>
      )}

      {step === 1 && manualOpen && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setManualOpen(false)}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-brand-600 mb-3"
          >
            ← 返回选择来源
          </button>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">手动添加一条记录</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-500 dark:text-slate-400">
              日期
              <input
                type="date"
                value={mDate}
                onChange={e => setMDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-400">
              指标
              <select
                value={mType}
                onChange={e => setMType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
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
            <label className="text-xs text-slate-500 dark:text-slate-400">
              数值
              <input
                type="number"
                value={mValue}
                onChange={e => setMValue(e.target.value)}
                placeholder="例如 480"
                aria-invalid={!!error && isNaN(parseFloat(mValue))}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-400">
              单位（可选）
              <input
                type="text"
                value={mUnit}
                onChange={e => setMUnit(e.target.value)}
                placeholder="min / % / bpm"
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            onClick={submitManual}
            className="mt-4 w-full rounded-full bg-brand-600 text-white py-2.5 text-sm hover:bg-brand-700"
          >
            添加记录
          </button>
        </section>
      )}

      {step === 2 && template && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
          <button
            onClick={() => { setStep(1); setTemplate(null); setPreview(null); setError(''); }}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-brand-600 mb-3"
          >
            ← 选择其他来源
          </button>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {template.icon} {template.name}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{template.description}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            获取方式：{template.where}
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">方式一：上传文件</p>
          <input
            ref={fileRef}
            type="file"
            accept={template.format === 'csv' ? '.csv,text/csv' : '.json,application/json'}
            onChange={onFile}
            className="block w-full text-sm text-slate-500 dark:text-slate-400 mb-4 file:mr-4 file:rounded-full file:border-0 file:bg-brand-600 file:text-white file:px-4 file:py-2 file:text-sm hover:file:bg-brand-700"
          />

          <div className="flex items-center gap-2 my-2">
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
            <span className="text-[11px] text-slate-400">或</span>
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">方式二：粘贴数据文本</p>
          <textarea
            value={paste}
            onChange={e => setPaste(e.target.value)}
            rows={6}
            placeholder="把 CSV / JSON 内容粘贴到这里…"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm font-mono"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={fillSample}
              className="flex-1 rounded-full border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 py-2 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/30"
            >
              填入示例数据
            </button>
            <button
              onClick={() => parseInput(paste)}
              disabled={!paste.trim()}
              className="flex-1 rounded-full bg-brand-600 text-white py-2 text-sm hover:bg-brand-700 disabled:opacity-40"
            >
              解析并预览
            </button>
          </div>
        </section>
      )}

      {step === 3 && preview && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">预览确认</h2>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">
            已解析 {preview.count} 条记录{preview.skipped > 0 ? `（跳过 ${preview.skipped} 条无法识别）` : ''}
          </p>

          {preview.columns.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {preview.columns.map(c => (
                <span key={c} className="rounded-full bg-slate-100 dark:bg-slate-600 px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-300">
                  {c}
                </span>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 p-3 text-xs mb-4">
            <p className="text-slate-400 dark:text-slate-500 mb-1.5">前 {previewRows.length} 条预览：</p>
            {previewRows.length === 0 ? (
              <p className="text-slate-400">（空）</p>
            ) : preview.kind === 'health' ? (
              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                {previewRows.map((s, i) => {
                  const row = s as HealthSample;
                  return (
                    <li key={i} className="flex gap-3">
                      <span className="w-24 shrink-0">{row.date}</span>
                      <span className="w-32 shrink-0">{row.type}</span>
                      <span className="w-16 shrink-0 text-right">{row.value} {row.unit}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                {previewRows.map((m, i) => {
                  const row = m as MoodEntry;
                  return (
                    <li key={i} className="flex gap-3">
                      <span className="w-24 shrink-0">{row.date}</span>
                      <span className="w-16 shrink-0">心情 {row.mood}/5</span>
                      <span className="truncate">{row.note || '（无备注）'}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setStep(2); setPreview(null); }}
              className="flex-1 rounded-full border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              返回修改
            </button>
            <button
              onClick={confirmImport}
              className="flex-1 rounded-full bg-brand-600 text-white py-2 text-sm hover:bg-brand-700"
            >
              确认导入
            </button>
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {log && (
        <div role="status" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm">
          <p>成功导入 {log.ok} 条记录{log.dropped > 0 ? `（跳过 ${log.dropped} 条）` : ''}。</p>
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

import { useState } from 'react';
import { usePrefs } from '../store/PrefsContext';

/**
 * Age gate (阶段三合规：未成年人模式).
 * 年龄判定超越单纯自选复选框——要求输入出生年份并确认，<18 直接进入
 * 纯本地记录模式（AI 陪伴交互隔离）。
 */
export default function AgeGate() {
  const { prefs, update } = usePrefs();
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  if (prefs.ageVerified) return null;

  const currentYear = new Date().getFullYear();

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1900 || y > currentYear) {
      setError('请输入有效的出生年份（1900-' + currentYear + '）。');
      return;
    }
    const age = currentYear - y;
    update({ ageVerified: true, minorMode: age < 18 });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-6">
      <form
        onSubmit={confirm}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-100 dark:border-slate-700"
        aria-label="年龄确认"
      >
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">欢迎使用 MoodHub</h1>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          MoodHub 是本地优先的心理健康记录工具。按《人工智能拟人化互动服务管理暂行办法》与未成年人网络保护要求，
          我们需要确认你的年龄：未满 18 周岁将进入纯本地记录模式（不含 AI 陪伴式回复）。
        </p>
        <label className="block mt-5 text-xs text-slate-500 dark:text-slate-400">
          出生年份
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            min={1900}
            max={currentYear}
            value={year}
            onChange={e => {
              setYear(e.target.value);
              setError('');
            }}
            placeholder="例如 2005"
            className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
          />
        </label>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={!year.trim()}
          className="mt-4 w-full rounded-full bg-brand-600 text-white py-2.5 text-sm hover:bg-brand-700 disabled:opacity-40"
        >
          确认并继续
        </button>
        <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
          本工具不构成医疗诊断或治疗建议。如处于心理危机，请拨打心理援助热线 12356 或紧急电话 110 / 120。
        </p>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { usePrefs } from '../store/PrefsContext';
import { PROVIDER_PRESETS, getPreset } from '../data/aiProviders';
import { DEFAULT_AI_SETTINGS } from '../data/storage';
import { buildExportBundle, moodsToCSV, samplesToCSV, downloadBlob } from '../core/export';
import type { AISettings } from '../core/types';

export default function Settings() {
  const { ai, saveAI, samples, moods, chat, clearAll } = useApp();
  const { prefs, update } = usePrefs();
  const [s, setS] = useState<AISettings>({ ...ai });
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [dataTip, setDataTip] = useState('');

  const preset = getPreset(s.providerId);

  function updateAI(patch: Partial<AISettings>) {
    setS(prev => ({ ...prev, ...patch }));
    setSaved(false);
  }

  function submitAI(e: React.FormEvent) {
    e.preventDefault();
    saveAI(s);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      {/* ===== Appearance (医疗界面规范: 主题/适老化/高对比度) ===== */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">外观</h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">主题</p>
            <div className="flex gap-2">
              {(
                [
                  ['light', '浅色'],
                  ['dark', '深色'],
                  ['system', '跟随系统'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => update({ theme: id })}
                  aria-pressed={prefs.theme === id}
                  className={
                    'flex-1 rounded-full px-3 py-1.5 text-sm transition-colors ' +
                    (prefs.theme === id
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between text-sm">
            <span>
              大字模式（适老化）
              <span className="block text-xs text-slate-400">基础字号放大至 18px，便于老年用户阅读</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.fontScale === 'large'}
              onChange={e => update({ fontScale: e.target.checked ? 'large' : 'normal' })}
              className="h-4 w-4 accent-brand-600"
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>
              高对比度模式
              <span className="block text-xs text-slate-400">增强边框与文字对比（WCAG 2.1 AA）</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.contrast === 'high'}
              onChange={e => update({ contrast: e.target.checked ? 'high' : 'normal' })}
              className="h-4 w-4 accent-brand-600"
            />
          </label>
        </div>
      </section>

      {/* ===== Privacy & security (数据脱敏 + 超时锁屏) ===== */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">隐私与安全</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between text-sm">
            <span>
              隐私遮盖
              <span className="block text-xs text-slate-400">总览与日记中的敏感数值默认显示为 ••••，点击可临时查看</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.privacyMask}
              onChange={e => update({ privacyMask: e.target.checked })}
              className="h-4 w-4 accent-brand-600"
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>
              无操作自动锁定
              <span className="block text-xs text-slate-400">超时后隐藏全部内容，需 PIN 解锁（默认 15 分钟）</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.lockEnabled}
              onChange={e => update({ lockEnabled: e.target.checked })}
              className="h-4 w-4 accent-brand-600"
            />
          </label>

          <label className="block text-xs text-slate-500 dark:text-slate-400">
            解锁 PIN（4-6 位数字，留空则无需密码）
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              maxLength={6}
              value={prefs.lockPin}
              onChange={e => update({ lockPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              placeholder="例如 1234"
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs text-slate-500 dark:text-slate-400">
            自动锁定等待时间（分钟）
            <input
              type="number"
              min={1}
              max={120}
              value={prefs.lockTimeoutMin}
              onChange={e => update({ lockTimeoutMin: Math.max(1, Number(e.target.value) || 15) })}
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
            />
          </label>

          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            心理健康数据同样敏感。建议开启遮盖与自动锁定，防止他人在你离开时查看记录。
          </p>
        </div>
      </section>

      {/* ===== AI settings (unchanged behavior) ===== */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">AI 回复设置</h2>

        <form onSubmit={submitAI} className="space-y-4">
          <label className="flex items-center justify-between text-sm">
            <span>启用 AI 回复</span>
            <input
              type="checkbox"
              checked={s.enabled}
              onChange={e => updateAI({ enabled: e.target.checked })}
              className="h-4 w-4 accent-brand-600"
            />
          </label>

          <label className="block text-xs text-slate-500 dark:text-slate-400">
            服务商
            <select
              value={s.providerId}
              onChange={e => updateAI({ providerId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
            >
              {PROVIDER_PRESETS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs text-slate-500 dark:text-slate-400">
            API Key
            <input
              type="password"
              value={s.apiKey}
              onChange={e => updateAI({ apiKey: e.target.value })}
              placeholder={preset?.keyPlaceholder ?? '输入 API Key'}
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>在本机保存 Key（否则仅本次会话有效）</span>
            <input
              type="checkbox"
              checked={s.persistKey}
              onChange={e => updateAI({ persistKey: e.target.checked })}
              className="h-4 w-4 accent-brand-600"
            />
          </label>

          <label className="block text-xs text-slate-500 dark:text-slate-400">
            自定义 Base URL（留空用预设）
            <input
              type="text"
              value={s.baseUrl}
              onChange={e => updateAI({ baseUrl: e.target.value })}
              placeholder={preset?.baseUrl || 'https://…'}
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs text-slate-500 dark:text-slate-400">
            模型（留空用预设）
            <input
              type="text"
              value={s.model}
              onChange={e => updateAI({ model: e.target.value })}
              placeholder={preset?.defaultModel || '模型名'}
              list="model-options"
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
            />
            <datalist id="model-options">
              {(preset?.models ?? []).map(m => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>

          {preset?.note && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/40 dark:text-amber-400 rounded-xl px-3 py-2">
              {preset.note}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-brand-600 text-white py-2.5 text-sm hover:bg-brand-700"
          >
            保存设置
          </button>

          {saved && (
            <p role="status" className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl px-3 py-2">
              设置已保存。
            </p>
          )}
        </form>
      </section>

      {/* ===== Data management (导出 / 清空, 对应 ROADMAP 阶段一) ===== */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">数据管理</h2>

        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
          导出会生成文件并下载到本机，可随时备份或迁移；所有操作均在本机完成。
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => {
              const bundle = buildExportBundle({ samples, moods, chat, ai });
              downloadBlob(
                `moodhub-export-${new Date().toISOString().slice(0, 10)}.json`,
                JSON.stringify(bundle, null, 2),
                'application/json'
              );
              setDataTip('已导出全部数据（JSON）。');
            }}
            className="rounded-full bg-brand-600 text-white px-4 py-2 text-sm hover:bg-brand-700"
          >
            导出全部数据（JSON）
          </button>
          <button
            onClick={() => {
              downloadBlob(
                `moodhub-diary-${new Date().toISOString().slice(0, 10)}.csv`,
                moodsToCSV(moods),
                'text/csv;charset=utf-8'
              );
              setDataTip('已导出日记（CSV）。');
            }}
            className="rounded-full border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            导出日记（CSV）
          </button>
          <button
            onClick={() => {
              downloadBlob(
                `moodhub-health-${new Date().toISOString().slice(0, 10)}.csv`,
                samplesToCSV(samples),
                'text/csv;charset=utf-8'
              );
              setDataTip('已导出健康数据（CSV）。');
            }}
            className="rounded-full border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            导出健康数据（CSV）
          </button>
        </div>
        {dataTip && (
          <p role="status" className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl px-3 py-2 mb-4">
            {dataTip}
          </p>
        )}

        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full rounded-full border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              清空所有本地数据
            </button>
          ) : (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-3">
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed mb-2">
                此操作将永久删除本机全部日记、健康数据、树洞记录与 AI 设置，无法恢复。建议先导出备份。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    clearAll();
                    setS({ ...DEFAULT_AI_SETTINGS });
                    setConfirmClear(false);
                    setDataTip('已清空所有本地数据。');
                  }}
                  className="flex-1 rounded-full bg-red-600 text-white py-2 text-sm hover:bg-red-700"
                >
                  确认清空
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 rounded-full border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">关于</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          MoodHub v0.2.0 — 本地优先的心理健康记录工具。所有数据保存在本机浏览器存储中，
          不上传任何服务器。本工具不构成医疗诊断或治疗建议。若你正处于心理危机中，请优先
          拨打心理援助热线 12356 或紧急电话 110 / 120。
        </p>
      </section>
    </div>
  );
}

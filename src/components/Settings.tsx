import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { PROVIDER_PRESETS, getPreset } from '../data/aiProviders';
import type { AISettings } from '../core/types';

export default function Settings() {
  const { ai, saveAI } = useApp();
  const [s, setS] = useState<AISettings>({ ...ai });
  const [saved, setSaved] = useState(false);

  const preset = getPreset(s.providerId);

  function update(patch: Partial<AISettings>) {
    setS(prev => ({ ...prev, ...patch }));
    setSaved(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveAI(s);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">AI 回复设置</h2>

        <form onSubmit={submit} className="space-y-4">
          <label className="flex items-center justify-between text-sm">
            <span>启用 AI 回复</span>
            <input
              type="checkbox"
              checked={s.enabled}
              onChange={e => update({ enabled: e.target.checked })}
              className="h-4 w-4 accent-slate-800"
            />
          </label>

          <label className="block text-xs text-slate-500">
            服务商
            <select
              value={s.providerId}
              onChange={e => update({ providerId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {PROVIDER_PRESETS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs text-slate-500">
            API Key
            <input
              type="password"
              value={s.apiKey}
              onChange={e => update({ apiKey: e.target.value })}
              placeholder={preset?.keyPlaceholder ?? '输入 API Key'}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>在本机保存 Key（否则仅本次会话有效）</span>
            <input
              type="checkbox"
              checked={s.persistKey}
              onChange={e => update({ persistKey: e.target.checked })}
              className="h-4 w-4 accent-slate-800"
            />
          </label>

          <label className="block text-xs text-slate-500">
            自定义 Base URL（留空用预设）
            <input
              type="text"
              value={s.baseUrl}
              onChange={e => update({ baseUrl: e.target.value })}
              placeholder={preset?.baseUrl || 'https://…'}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs text-slate-500">
            模型（留空用预设）
            <input
              type="text"
              value={s.model}
              onChange={e => update({ model: e.target.value })}
              placeholder={preset?.defaultModel || '模型名'}
              list="model-options"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <datalist id="model-options">
              {(preset?.models ?? []).map(m => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>

          {preset?.note && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
              {preset.note}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-slate-800 text-white py-2.5 text-sm hover:bg-slate-700"
          >
            保存设置
          </button>

          {saved && (
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">
              设置已保存。
            </p>
          )}
        </form>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">关于</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          MoodHub v0.2.0 — 本地优先的心理健康记录工具。所有数据保存在本机浏览器存储中，
          不上传任何服务器。本工具不构成医疗诊断或治疗建议。若你正处于心理危机中，请优先
          拨打心理援助热线 12356 或紧急电话 110 / 120。
        </p>
      </section>
    </div>
  );
}

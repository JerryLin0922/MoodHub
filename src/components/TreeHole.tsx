import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { usePrefs } from '../store/PrefsContext';
import { HUMAN_SUPPORT_CHANNELS } from '../core/support';
import type { CrisisResource } from '../core/types';

/** AI 身份标识：周期性提醒（每天首次进入树洞且启用 AI 时提示一次）。 */
const AI_NOTICE_KEY = 'moodhub.aiNoticedDate';
function aiNoticedToday(): boolean {
  return localStorage.getItem(AI_NOTICE_KEY) === new Date().toISOString().slice(0, 10);
}
function markAiNoticed() {
  localStorage.setItem(AI_NOTICE_KEY, new Date().toISOString().slice(0, 10));
}

export default function TreeHole() {
  const { chat, sendMessage, ai } = useApp();
  const { prefs } = usePrefs();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showAiNotice, setShowAiNotice] = useState(() => ai.enabled && !prefs.minorMode && !aiNoticedToday());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText('');
    // 已展示过 AI 身份标识提醒，标记今日已提示。
    if (showAiNotice) {
      markAiNoticed();
      setShowAiNotice(false);
    }
    try {
      await sendMessage(t);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">树洞</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {prefs.minorMode
            ? '未成年人模式：树洞仅在本机进行本地规则回复，不包含 AI 陪伴式交互。'
            : ai.enabled
              ? '本地规则优先，AI 辅助回复；敏感内容 AI 不会绕过危机提示。'
              : '当前为本地规则回复。可在「设置」中启用 AI 回复。'}
        </p>
        {showAiNotice && !prefs.minorMode && (
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/60 rounded-lg px-2 py-1.5 leading-relaxed">
            AI 回复由 AI 生成，仅供参考，不构成医疗建议。
          </p>
        )}
        <details className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/60 rounded-lg px-2 py-1.5">
          <summary className="cursor-pointer select-none">真人支持渠道（可选升级路径）</summary>
          <ul className="mt-1.5 space-y-0.5">
            {HUMAN_SUPPORT_CHANNELS.map(r => (
              <li key={r.name}>
                {r.name}：{r.contact}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 leading-relaxed">
            在树洞输入「想找真人聊聊」等，回复中也会附上这些渠道。
          </p>
        </details>
      </section>

      {/* aria-live: screen readers announce new assistant messages (可访问性规范). */}
      <div className="space-y-3" aria-live="polite" aria-relevant="additions">
        {chat.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-10">
            这里只有你自己。想说点什么都可以。
          </p>
        )}

        {chat.map(m => {
          if (m.role === 'user') {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap">
                  {m.text}
                </div>
              </div>
            );
          }

          if (m.source === 'ai') {
            return (
              <div key={m.id} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-700 px-4 py-2.5 text-sm whitespace-pre-wrap dark:text-slate-100">
                  <span
                    className="mr-2 inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 px-2 py-0.5 text-[10px] font-medium"
                    title="AI 生成内容，仅供参考，不构成医疗建议"
                  >
                    AI 生成
                  </span>
                  {m.text}
                  {m.aiError && (
                    <p className="mt-1 text-xs text-red-400">AI 调用失败，已用本地规则回复。</p>
                  )}
                  {m.resources && m.resources.length > 0 && (
                    <HumanSupportList resources={m.resources} />
                  )}
                </div>
              </div>
            );
          }

          // Rule-based reply: structured blocks.
          return (
            <div key={m.id} className="flex justify-start">
              <div
                className={
                  'max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm ' +
                  (m.crisis
                    ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                    : 'bg-brand-50 dark:bg-slate-700 border border-brand-100 dark:border-slate-600')
                }
              >
                {m.crisis ? (
                  // Crisis card: red alert, highest visual priority (医疗安全优先).
                  <div className="space-y-2" role="alert">
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      你需要立刻获得帮助：
                    </p>
                    <p className="text-slate-700 dark:text-slate-200">{m.empathy}</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc pl-4 space-y-1">
                      {(m.resources ?? []).map(r => (
                        <li key={r.name}>
                          {r.name}：{r.contact}
                        </li>
                      ))}
                    </ul>
                    <p className="text-slate-700 dark:text-slate-200">{m.followUp}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-700 dark:text-slate-200">{m.empathy}</p>
                    {(m.suggestions ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(m.suggestions ?? []).map(s => (
                          <span
                            key={s.label}
                            title={s.detail}
                            className="rounded-full bg-white dark:bg-slate-600 border border-brand-200 dark:border-slate-500 text-brand-700 dark:text-brand-200 px-3 py-1 text-xs"
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.followUp && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">{m.followUp}</p>
                    )}
                    {m.resources && m.resources.length > 0 && (
                      <HumanSupportList resources={m.resources} />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 p-3 shadow-card">
        <label className="sr-only" htmlFor="treehole-input">说点什么</label>
        <textarea
          id="treehole-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="说点什么…（Enter 发送，Shift+Enter 换行）"
          className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex justify-end pt-2">
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="rounded-full bg-brand-600 text-white px-5 py-1.5 text-sm disabled:opacity-40 hover:bg-brand-700"
          >
            {sending ? '思考中…' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 真人支持渠道卡：作为 AI + 真人混合陪伴的可选升级路径展示。 */
function HumanSupportList({ resources }: { resources: CrisisResource[] }) {
  return (
    <div className="mt-2 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-brand-200 dark:border-slate-600 px-3 py-2">
      <p className="text-[11px] font-semibold text-brand-700 dark:text-brand-200 mb-1">
        如需真人支持，可联系：
      </p>
      <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
        {resources.map(r => (
          <li key={r.name}>
            {r.name}：{r.contact}
          </li>
        ))}
      </ul>
    </div>
  );
}

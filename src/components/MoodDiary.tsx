import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { usePrefs } from '../store/PrefsContext';
import {
  MOOD_EMOJI,
  MOOD_FLOWER,
  ACHIEVEMENTS,
  computeStreak,
  evaluateAchievements,
  isMilestoneDay,
} from '../core/gamification';
import { today } from '../core/utils';

/**
 * 游戏化日记（对应 ROADMAP-2026 阶段二 / FEEDBACK FB-2026-09-01）。
 * - 快捷情绪按钮：点一下心情即完成打卡（3 秒内），可展开补充细节；
 * - 连续记录 streak + 成就勋章；
 * - 情绪花园：每次记录开一朵花，连续里程碑点缀星星；
 * - 花朵绽放微动画。
 */

const MOOD_LABELS = ['很差', '较差', '一般', '较好', '很好'] as const;
const STRESS_LABELS = ['无', '轻微', '中度', '较高', '很高'] as const;
const SLEEP_LABELS = ['很差', '较差', '一般', '较好', '很好'] as const;

export default function MoodDiary() {
  const { moods, saveMood } = useApp();
  const { prefs } = usePrefs();

  const [date, setDate] = useState(today());
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(1);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [note, setNote] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [savedTip, setSavedTip] = useState('');
  const [lastSaved, setLastSaved] = useState<{ date: string; mood: number } | null>(null);

  const existing = useMemo(() => moods.find(m => m.date === date), [moods, date]);
  const streak = useMemo(() => computeStreak(moods), [moods]);
  const achievements = useMemo(() => evaluateAchievements(moods), [moods]);
  const garden = useMemo(
    () => [...moods].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [moods]
  );

  function flash(msg: string) {
    setSavedTip(msg);
    window.setTimeout(() => setSavedTip(''), 2400);
  }

  /** 快捷打卡：点击心情即保存（保留当天已有的压力/睡眠/备注细节）。 */
  function quickSave(m: number) {
    const base = moods.find(x => x.date === date);
    saveMood({
      date,
      mood: m,
      stress: base?.stress ?? 1,
      sleepQuality: base?.sleepQuality ?? 3,
      note: base?.note ?? '',
    });
    setMood(m);
    setLastSaved({ date, mood: m });
    flash(base ? '已更新今日心情' : '已记录，情绪花园长出一朵新花');
  }

  function submitDetail() {
    saveMood({ date, mood, stress, sleepQuality, note: note.trim() });
    setNote('');
    setShowDetail(false);
    setLastSaved({ date, mood });
    flash('已保存');
  }

  const history = useMemo(
    () => [...moods].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [moods]
  );

  function renderScale(value: number, setValue: (v: number) => void, labels: readonly string[]) {
    return (
      <div className="flex gap-2" role="group">
        {labels.map((label, i) => {
          const v = i + 1;
          const on = value === v;
          return (
            <button
              key={label}
              onClick={() => setValue(v)}
              aria-pressed={on}
              className={
                'flex-1 rounded-xl py-2 text-sm transition-colors ' +
                (on
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600')
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Streak 头卡 */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">连续记录</p>
            <p className="text-3xl font-bold text-brand-600 mt-0.5">
              {streak.current}
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">天</span>
            </p>
          </div>
          <div className="text-right text-xs text-slate-400 dark:text-slate-500 space-y-1">
            <p>最长纪录 {streak.longest} 天</p>
            <p className={streak.hasToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
              {streak.hasToday ? '今日已打卡' : '今天还没记录，点一下心情即可'}
            </p>
          </div>
        </div>
      </section>

      {/* 快捷情绪打卡 */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">今天感觉如何？</h2>
          <label className="text-xs text-slate-400 dark:text-slate-500">
            日期
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="ml-1 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-2 py-1 text-xs"
            />
          </label>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          点一下心情即可记录，也可以展开补充压力、睡眠与备注。
        </p>

        <div className="flex justify-between gap-2" role="group" aria-label="快捷心情">
          {MOOD_EMOJI.map((emoji, i) => {
            const v = i + 1;
            const on = existing?.mood === v;
            return (
              <button
                key={emoji}
                onClick={() => quickSave(v)}
                aria-pressed={on}
                aria-label={`心情${MOOD_LABELS[i]}（${v}分），点击立即记录`}
                className={
                  'flex-1 flex flex-col items-center rounded-xl py-3 transition-all ' +
                  (on
                    ? 'bg-brand-50 dark:bg-brand-900/40 ring-2 ring-brand-500'
                    : 'bg-slate-50 dark:bg-slate-700/40 hover:bg-brand-50/60 dark:hover:bg-slate-700')
                }
              >
                <span className="text-2xl leading-none" aria-hidden="true">{emoji}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{MOOD_LABELS[i]}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowDetail(v => !v)}
          aria-expanded={showDetail}
          className="mt-3 w-full rounded-full border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          {showDetail ? '收起补充' : '补充细节（压力 / 睡眠 / 备注）'}
        </button>

        {showDetail && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">心情（{MOOD_LABELS[mood - 1]}）</p>
              {renderScale(mood, setMood, MOOD_LABELS)}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">压力（{STRESS_LABELS[stress - 1]}）</p>
              {renderScale(stress, setStress, STRESS_LABELS)}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">睡眠质量（{SLEEP_LABELS[sleepQuality - 1]}）</p>
              {renderScale(sleepQuality, setSleepQuality, SLEEP_LABELS)}
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5" htmlFor="diary-note">
                备注
              </label>
              <textarea
                id="diary-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="今天发生了什么？"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={submitDetail}
              className="w-full rounded-full bg-brand-600 text-white py-2.5 text-sm hover:bg-brand-700"
            >
              {existing ? '更新记录' : '保存记录'}
            </button>
          </div>
        )}

        {savedTip && (
          <p role="status" className="mt-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl px-3 py-2">
            {savedTip}
          </p>
        )}
      </section>

      {/* 情绪花园 */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">我的情绪花园</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          每记录一天，花园里就开一朵花；连续记录 3 / 7 / 14 天会点缀星星。
        </p>
        {garden.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">
            花园还空着。记录第一条心情，这里就会长出第一朵花。
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
            {garden.map(e => {
              const bloom =
                lastSaved != null && e.date === lastSaved.date && e.mood === lastSaved.mood;
              return (
                <div key={e.date} className="flex flex-col items-center gap-1">
                  <Flower mood={e.mood} size={40} animate={bloom} />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{e.date.slice(5)}</span>
                  {isMilestoneDay(e.date, moods) && (
                    <span className="text-xs leading-none" title="连续记录里程碑">✨</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 成就 */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">成就</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          已解锁 {achievements.length} / {ACHIEVEMENTS.length}
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {ACHIEVEMENTS.map(a => {
            const unlocked = achievements.some(x => x.id === a.id);
            return (
              <div
                key={a.id}
                title={a.desc}
                className={
                  'rounded-xl border p-3 text-center ' +
                  (unlocked
                    ? 'border-amber-200 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-900/20'
                    : 'border-slate-100 dark:border-slate-700 opacity-45 grayscale')
                }
              >
                <span className="block text-xl" aria-hidden="true">{a.icon}</span>
                <span className="block text-xs font-medium mt-1">{a.title}</span>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{a.desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 最近记录 */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">最近记录</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">还没有日记，记录第一条吧</p>
        ) : (
          <ul className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {history.map(e => (
              <li key={e.date} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{e.date}</p>
                  {e.note &&
                    (prefs.privacyMask ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 select-none">••••</p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 break-words">{e.note}</p>
                    ))}
                </div>
                <div className="text-right text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  <p>心情 {MOOD_LABELS[e.mood - 1]}</p>
                  <p>压力 {STRESS_LABELS[e.stress - 1]}</p>
                  <p>睡眠 {SLEEP_LABELS[e.sleepQuality - 1]}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** 情绪花朵：按心情 1-5 映射花瓣颜色。 */
function Flower({ mood, size = 40, animate = false }: { mood: number; size?: number; animate?: boolean }) {
  const c = MOOD_FLOWER[Math.min(4, Math.max(1, mood)) - 1];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={animate ? 'animate-bloom' : undefined}
      aria-hidden="true"
      role="img"
    >
      {[0, 72, 144, 216, 288].map(deg => (
        <ellipse
          key={deg}
          cx="24"
          cy="17"
          rx="7"
          ry="11"
          fill={c.petal}
          opacity="0.9"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="6" fill={c.center} stroke={c.petal} strokeWidth="1" />
    </svg>
  );
}

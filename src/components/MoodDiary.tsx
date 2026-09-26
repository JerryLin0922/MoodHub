import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';

const MOOD_LABELS = ['很差', '较差', '一般', '较好', '很好'] as const;
const STRESS_LABELS = ['无', '轻微', '中度', '较高', '很高'] as const;
const SLEEP_LABELS = ['很差', '较差', '一般', '较好', '很好'] as const;

export default function MoodDiary() {
  const { moods, saveMood } = useApp();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(1);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [note, setNote] = useState('');

  const existing = useMemo(() => moods.find(m => m.date === date), [moods, date]);

  function submit() {
    saveMood({ date, mood, stress, sleepQuality, note: note.trim() });
    setNote('');
  }

  const history = useMemo(
    () => [...moods].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [moods]
  );

  function renderScale(
    value: number,
    setValue: (v: number) => void,
    labels: readonly string[]
  ) {
    return (
      <div className="flex gap-2">
        {labels.map((label, i) => {
          const v = i + 1;
          const on = value === v;
          return (
            <button
              key={label}
              onClick={() => setValue(v)}
              className={
                'flex-1 rounded-xl py-2 text-sm transition-colors ' +
                (on
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
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
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">记录今天</h2>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />

        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 mb-1.5">心情（{MOOD_LABELS[mood - 1]}）</p>
            {renderScale(mood, setMood, MOOD_LABELS)}
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5">压力（{STRESS_LABELS[stress - 1]}）</p>
            {renderScale(stress, setStress, STRESS_LABELS)}
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5">睡眠质量（{SLEEP_LABELS[sleepQuality - 1]}）</p>
            {renderScale(sleepQuality, setSleepQuality, SLEEP_LABELS)}
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5">备注</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="今天发生了什么？"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={submit}
            className="w-full rounded-full bg-slate-800 text-white py-2.5 text-sm hover:bg-slate-700"
          >
            {existing ? '更新记录' : '保存记录'}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">最近记录</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">还没有日记，记录第一条吧</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {history.map(e => (
              <li key={e.date} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{e.date}</p>
                  {e.note && <p className="text-xs text-slate-400 mt-0.5">{e.note}</p>}
                </div>
                <div className="text-right text-xs text-slate-500">
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

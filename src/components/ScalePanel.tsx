import { useState } from 'react';
import { getScale, type Scale } from '../core/scales';
import { usePrefs } from '../store/PrefsContext';
import Scl90Panel from './Scl90Panel';

const BASE_SCALES = ['phq9', 'gad7'] as const;

export default function ScalePanel() {
  const { prefs } = usePrefs();
  const [scaleId, setScaleId] = useState('phq9');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);

  const isScl90 = scaleId === 'scl90';
  const scale: Scale | undefined = isScl90 ? undefined : getScale(scaleId);

  function pick(i: number, score: number) {
    setAnswers(prev => ({ ...prev, [i]: score }));
    setDone(false);
  }

  const answeredCount = Object.keys(answers).length;
  const total = scale ? scale.items.reduce((sum, _, i) => sum + (answers[i] ?? 0), 0) : 0;

  function reset() {
    setAnswers({});
    setDone(false);
  }

  function switchScale(id: string) {
    setScaleId(id);
    reset();
  }

  const available = prefs.scl90Enabled ? [...BASE_SCALES, 'scl90'] : [...BASE_SCALES];

  return (
    <div className="space-y-4">
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">自评量表</h2>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="选择量表">
            {available.map(id => (
              <button
                key={id}
                onClick={() => switchScale(id)}
                aria-pressed={scaleId === id}
                className={
                  'rounded-full px-3 py-1 text-xs transition-colors ' +
                  (scaleId === id
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600')
                }
              >
                {id === 'scl90' ? 'SCL-90' : getScale(id)!.shortName}
              </button>
            ))}
          </div>
        </div>

        {isScl90 ? (
          <Scl90Panel />
        ) : (
          scale && (
            <>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{scale.description}</p>

              <div className="space-y-3">
                {scale.items.map((item, i) => (
                  <fieldset key={i} className="rounded-xl border border-slate-100 dark:border-slate-700 p-3">
                    <legend className="text-sm text-slate-700 dark:text-slate-200 mb-2">
                      {i + 1}. {item}
                    </legend>
                    <div className="flex gap-1.5" role="radiogroup" aria-label={`第 ${i + 1} 题`}>
                      {scale.options.map(opt => (
                        <button
                          key={opt.score}
                          onClick={() => pick(i, opt.score)}
                          role="radio"
                          aria-checked={answers[i] === opt.score}
                          className={
                            'flex-1 rounded-lg px-2 py-1.5 text-xs transition-colors ' +
                            (answers[i] === opt.score
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600')
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  已作答 {answeredCount}/{scale.items.length}
                </p>
                {answeredCount === scale.items.length && !done && (
                  <button
                    onClick={() => setDone(true)}
                    className="rounded-full bg-brand-600 text-white px-5 py-1.5 text-sm hover:bg-brand-700"
                  >
                    查看结果
                  </button>
                )}
                {done && (
                  <button
                    onClick={reset}
                    className="rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-5 py-1.5 text-sm hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    重新作答
                  </button>
                )}
              </div>

              {done && (
                <div className="mt-4 rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 p-3">
                  <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">
                    得分 {total} / {scale.items.length * 3}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{scale.interpret(total)}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{scale.disclaimer}</p>
                </div>
              )}
            </>
          )
        )}
      </section>
    </div>
  );
}

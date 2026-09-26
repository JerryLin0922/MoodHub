import { useState } from 'react';
import { getScale, type Scale } from '../core/scales';

export default function ScalePanel() {
  const [scaleId, setScaleId] = useState('phq9');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);

  const scale: Scale = getScale(scaleId)!;

  function pick(i: number, score: number) {
    setAnswers(prev => ({ ...prev, [i]: score }));
    setDone(false);
  }

  const answeredCount = Object.keys(answers).length;
  const total = scale.items.reduce((sum, _, i) => sum + (answers[i] ?? 0), 0);

  function reset() {
    setAnswers({});
    setDone(false);
  }

  function switchScale(id: string) {
    setScaleId(id);
    reset();
  }

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-500">自评量表</h2>
          <div className="flex gap-2">
            {['phq9', 'gad7'].map(id => (
              <button
                key={id}
                onClick={() => switchScale(id)}
                className={
                  'rounded-full px-3 py-1 text-xs transition-colors ' +
                  (scaleId === id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                }
              >
                {getScale(id)!.shortName}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4">{scale.description}</p>

        <div className="space-y-3">
          {scale.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-3">
              <p className="text-sm text-slate-700 mb-2">
                {i + 1}. {item}
              </p>
              <div className="flex gap-1.5">
                {scale.options.map(opt => (
                  <button
                    key={opt.score}
                    onClick={() => pick(i, opt.score)}
                    className={
                      'flex-1 rounded-lg px-2 py-1.5 text-xs transition-colors ' +
                      (answers[i] === opt.score
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            已作答 {answeredCount}/{scale.items.length}
          </p>
          {answeredCount === scale.items.length && !done && (
            <button
              onClick={() => setDone(true)}
              className="rounded-full bg-slate-800 text-white px-5 py-1.5 text-sm hover:bg-slate-700"
            >
              查看结果
            </button>
          )}
          {done && (
            <button
              onClick={reset}
              className="rounded-full bg-slate-100 text-slate-600 px-5 py-1.5 text-sm hover:bg-slate-200"
            >
              重新作答
            </button>
          )}
        </div>

        {done && (
          <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-3">
            <p className="text-sm font-semibold text-indigo-700">
              得分 {total} / {scale.items.length * 3}
            </p>
            <p className="text-xs text-slate-600 mt-1">{scale.interpret(total)}</p>
            <p className="text-xs text-amber-600 mt-2">{scale.disclaimer}</p>
          </div>
        )}
      </section>
    </div>
  );
}

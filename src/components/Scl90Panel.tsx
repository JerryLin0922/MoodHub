import { useMemo, useState } from 'react';
import {
  SCL90_ITEMS,
  SCL90_OPTIONS,
  scoreSCL90,
  SCL90_DISCLAIMER,
  type SCL90Result,
} from '../core/scales/scl90';

const PAGE_SIZE = 10;
const CRISIS_RESOURCES = '全国心理援助热线 12356（24 小时）／北京心理危机干预中心 010-8295-1332／紧急情况 110 / 120';

function fmt(v: number): string {
  return v.toFixed(2);
}

export default function Scl90Panel() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const pageCount = Math.ceil(SCL90_ITEMS.length / PAGE_SIZE);
  const pageItems = SCL90_ITEMS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const result: SCL90Result | null = useMemo(
    () => (done ? scoreSCL90(answers) : null),
    [done, answers]
  );

  function pick(itemIndex: number, score: number) {
    setAnswers(prev => ({ ...prev, [itemIndex]: score }));
    setDone(false);
  }

  function reset() {
    setAnswers({});
    setPage(0);
    setDone(false);
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">SCL-90 症状自评量表</h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          已作答 {answeredCount}/{SCL90_ITEMS.length}
        </span>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        请根据最近一周的实际情况，为每个症状选择最符合你的程度。
      </p>

      {!done && (
        <>
          <div
            className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-4"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={SCL90_ITEMS.length}
            aria-valuenow={answeredCount}
            aria-label="作答进度"
          >
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${(answeredCount / SCL90_ITEMS.length) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {pageItems.map((item, offset) => {
              const i = page * PAGE_SIZE + offset;
              return (
                <fieldset key={i} className="rounded-xl border border-slate-100 dark:border-slate-700 p-3">
                  <legend className="text-sm text-slate-700 dark:text-slate-200 mb-2">
                    {i + 1}. {item}
                  </legend>
                  <div className="flex gap-1.5" role="radiogroup" aria-label={`第 ${i + 1} 题`}>
                    {SCL90_OPTIONS.map(opt => (
                      <button
                        key={opt.score}
                        type="button"
                        onClick={() => pick(i, opt.score)}
                        role="radio"
                        aria-checked={answers[i] === opt.score}
                        className={
                          'flex-1 rounded-lg px-1 py-1.5 text-xs transition-colors ' +
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
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              上一页
            </button>
            <span className="text-xs text-slate-400">
              第 {page + 1}/{pageCount} 页
            </span>
            {page < pageCount - 1 ? (
              <button
                type="button"
                disabled={!pageItems.every((_, o) => answers[page * PAGE_SIZE + o] != null)}
                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                className="rounded-full bg-brand-600 text-white px-4 py-1.5 text-sm disabled:opacity-40 hover:bg-brand-700"
              >
                下一页
              </button>
            ) : (
              <button
                type="button"
                disabled={answeredCount < SCL90_ITEMS.length}
                onClick={() => setDone(true)}
                className="rounded-full bg-brand-600 text-white px-4 py-1.5 text-sm disabled:opacity-40 hover:bg-brand-700"
              >
                查看结果
              </button>
            )}
          </div>
        </>
      )}

      {done && result && (
        <div className="space-y-3">
          {result.crisisItems.length > 0 && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                你报告了可能与心理危机相关的感受（第{' '}
                {result.crisisItems.map(n => SCL90_ITEMS[n - 1]).join('、')}{' '}
                项），请务必重视并尽快寻求专业帮助。
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{CRISIS_RESOURCES}</p>
            </div>
          )}

          {result.screenPositive && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                筛查结果呈阳性，建议前往精神/心理专科进一步评估。
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                总均分 {fmt(result.mean)}（参考界值 2.00）／阳性项目数 {result.positiveCount}（参考界值 43）／总分 {result.total}（参考界值 160）
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/60 p-3">
              <p className="text-xs text-slate-400 dark:text-slate-500">总均分</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{fmt(result.mean)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/60 p-3">
              <p className="text-xs text-slate-400 dark:text-slate-500">总分</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{result.total}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/60 p-3">
              <p className="text-xs text-slate-400 dark:text-slate-500">阳性项目数</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{result.positiveCount}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/60 p-3">
              <p className="text-xs text-slate-400 dark:text-slate-500">阳性项目均分</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {result.positiveCount > 0 ? fmt(result.positiveMean) : '—'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                  <th className="py-2 pr-3 font-medium">因子</th>
                  <th className="py-2 px-3 font-medium">因子分</th>
                  <th className="py-2 px-3 font-medium">条目</th>
                  <th className="py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {result.factorScores.map(f => (
                  <tr key={f.id} className="border-b border-slate-50 dark:border-slate-700/50">
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{f.name}</td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{fmt(f.score)}</td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-400 dark:text-slate-500">{f.answered}</td>
                    <td className="py-2 whitespace-nowrap">
                      {f.elevated ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400">偏高</span>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">正常</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500">{SCL90_DISCLAIMER}</p>

          <button
            type="button"
            onClick={reset}
            className="w-full rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            重新作答
          </button>
        </div>
      )}
    </section>
  );
}

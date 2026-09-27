import { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider } from './store/AppContext';
import { PrefsProvider, usePrefs } from './store/PrefsContext';
import Tabs from './components/Tabs';
import Overview from './components/Overview';
import DataImport from './components/DataImport';
import MoodDiary from './components/MoodDiary';

// Code-split: the tree-hole screen pulls in recharts only there.
const TreeHole = lazy(() => import('./components/TreeHole'));
const Settings = lazy(() => import('./components/Settings'));

const TAB_DEFS = [
  { id: 'overview', label: '总览' },
  { id: 'diary',    label: '日记' },
  { id: 'import',   label: '导入' },
  { id: 'treehole', label: '树洞' },
  { id: 'settings', label: '设置' },
] as const;

type TabId = (typeof TAB_DEFS)[number]['id'];

/**
 * Full-screen privacy lock shown after the inactivity timeout.
 * Medical-design spec: sensitive data must not stay visible unattended.
 */
function LockScreen() {
  const { prefs, unlock } = usePrefs();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!unlock(pin)) {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-xs rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-100 dark:border-slate-700"
        aria-label="隐私锁屏解锁"
      >
        <h1 className="text-lg font-bold text-center text-slate-800 dark:text-slate-100">
          MoodHub
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400">
          已自动锁定，保护你的隐私数据
        </p>
        {prefs.lockPin ? (
          <>
            <label className="block mt-5 text-xs text-slate-500 dark:text-slate-400">
              输入 4-6 位 PIN 解锁
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value)}
                aria-invalid={error}
                className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-center text-lg tracking-[0.5em] dark:bg-slate-700 dark:text-white"
              />
            </label>
            {error && (
              <p role="alert" className="mt-2 text-xs text-red-600">
                PIN 不正确，请重试
              </p>
            )}
            <button
              type="submit"
              disabled={pin.length < 4}
              className="mt-4 w-full rounded-full bg-brand-600 text-white py-2.5 text-sm hover:bg-brand-700 disabled:opacity-40"
            >
              解锁
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => unlock('')}
            className="mt-5 w-full rounded-full bg-brand-600 text-white py-2.5 text-sm hover:bg-brand-700"
          >
            点击解锁
          </button>
        )}
      </form>
    </div>
  );
}

function Shell() {
  const [tab, setTab] = useState<TabId>('overview');
  const { locked, lock } = usePrefs();

  // Keep the user's last tab across re-renders.
  useEffect(() => {
    const saved = sessionStorage.getItem('moodhub.tab');
    if (saved && TAB_DEFS.some(t => t.id === saved)) setTab(saved as TabId);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('moodhub.tab', tab);
  }, [tab]);

  return (
    <div className="min-h-screen bg-warm-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-500" aria-hidden="true" />
            MoodHub
          </h1>
          <Tabs defs={TAB_DEFS} active={tab} onChange={t => setTab(t as TabId)} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        {tab === 'overview' && <Overview />}
        {tab === 'diary' && <MoodDiary />}
        {tab === 'import' && <DataImport />}
        {tab === 'treehole' && (
          <Suspense fallback={<div className="py-20 text-center text-slate-400">加载中…</div>}>
            <TreeHole />
          </Suspense>
        )}
        {tab === 'settings' && (
          <Suspense fallback={<div className="py-20 text-center text-slate-400">加载中…</div>}>
            <Settings />
          </Suspense>
        )}
      </main>

      <button
        onClick={lock}
        aria-label="立即锁定"
        title="立即锁定"
        className="fixed bottom-4 right-4 z-20 h-11 w-11 rounded-full bg-white dark:bg-slate-800 shadow-card border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-warm-100 dark:hover:bg-slate-700 flex items-center justify-center"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </button>

      {locked && <LockScreen />}
    </div>
  );
}

export default function App() {
  return (
    <PrefsProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </PrefsProvider>
  );
}

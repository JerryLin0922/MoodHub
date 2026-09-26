import { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider } from './store/AppContext';
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

export default function App() {
  const [tab, setTab] = useState<TabId>('overview');

  // Keep the user's last tab across re-renders.
  useEffect(() => {
    const saved = sessionStorage.getItem('moodhub.tab');
    if (saved && TAB_DEFS.some(t => t.id === saved)) setTab(saved as TabId);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('moodhub.tab', tab);
  }, [tab]);

  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-bold">MoodHub</h1>
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
      </div>
    </AppProvider>
  );
}

import { useEffect, useState } from 'react';

/**
 * Anti-dependency reminder (阶段三合规：防依赖设计).
 * 单次会话连续使用超过 2 小时时弹窗提醒休息（对齐中国《办法》休息提示思路）；
 * 每天最多提醒一次，避免打扰。
 */
const LIMIT_MIN = 120;
const CHECK_MS = 60_000;
const REMIND_KEY = 'moodhub.restRemindDate';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function RestReminder() {
  const [show, setShow] = useState(false);
  const [elapsedMin, setElapsedMin] = useState(0);

  useEffect(() => {
    const KEY = 'moodhub.sessionStartTs';
    let start = Number(sessionStorage.getItem(KEY));
    if (!start) {
      start = Date.now();
      sessionStorage.setItem(KEY, String(start));
    }

    const tick = () => {
      const min = Math.floor((Date.now() - start) / 60_000);
      setElapsedMin(min);
      if (min >= LIMIT_MIN && localStorage.getItem(REMIND_KEY) !== todayISO()) {
        setShow(true);
      }
    };

    tick();
    const timer = window.setInterval(tick, CHECK_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (!show) return null;

  function close() {
    localStorage.setItem(REMIND_KEY, todayISO());
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">休息一下</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          你已经连续使用约 {elapsedMin} 分钟了。情绪记录不需要一次做完，起来活动一下、
          喝点水，等状态好再回来也可以。
        </p>
        <button
          onClick={close}
          className="mt-4 w-full rounded-full bg-brand-600 text-white py-2.5 text-sm hover:bg-brand-700"
        >
          好的，休息一下
        </button>
      </div>
    </div>
  );
}

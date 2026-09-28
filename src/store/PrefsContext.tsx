/**
 * Global preferences context: appearance (theme/contrast/font-scale),
 * privacy mask and inactivity auto-lock (15-min logout per design spec).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  applyPrefs,
  loadPrefs,
  resolveTheme,
  savePrefs,
  watchSystemTheme,
  DEFAULT_PREFS,
  type AppPreferences,
} from '../theme';

interface PrefsCtxValue {
  prefs: AppPreferences;
  update: (patch: Partial<AppPreferences>) => void;
  locked: boolean;
  lock: () => void;
  /** Returns true when the PIN matches (or no PIN is configured). */
  unlock: (pin: string) => boolean;
}

const Ctx = createContext<PrefsCtxValue | null>(null);

export function usePrefs(): PrefsCtxValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePrefs must be used inside <PrefsProvider>');
  return v;
}

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'keyup', 'scroll', 'touchstart'] as const;

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppPreferences>(() => loadPrefs());
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Keep document theme in sync on first paint and on every change.
  useEffect(() => {
    applyPrefs(prefs);
  }, [prefs]);

  // Follow system theme changes while in `system` mode.
  useEffect(() => {
    return watchSystemTheme(() => {
      setPrefs(prev => {
        applyPrefs(prev);
        return prev;
      });
    });
  }, []);

  const update = useCallback((patch: Partial<AppPreferences>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  const lock = useCallback(() => setLocked(true), []);

  const unlock = useCallback(
    (pin: string) => {
      if (!prefs.lockPin) {
        setLocked(false);
        return true;
      }
      if (pin === prefs.lockPin) {
        setLocked(false);
        return true;
      }
      return false;
    },
    [prefs.lockPin]
  );

  // Inactivity timer: lock the app after lockTimeoutMin minutes of no activity.
  useEffect(() => {
    if (!prefs.lockEnabled) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const reset = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(
        () => setLocked(true),
        Math.max(1, prefs.lockTimeoutMin) * 60 * 1000
      );
    };

    const events = ACTIVITY_EVENTS;
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();

    return () => {
      events.forEach(ev => window.removeEventListener(ev, reset));
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [prefs.lockEnabled, prefs.lockTimeoutMin]);

  const value = useMemo<PrefsCtxValue>(
    () => ({ prefs, update, locked, lock, unlock }),
    [prefs, update, locked, lock, unlock]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Keep theme resolution available outside React for CSS-variable consumers. */
export { resolveTheme, DEFAULT_PREFS };

/**
 * Appearance & privacy preferences (医疗患者端界面设计规范落地).
 *
 * - Medical-blue brand color (#1890FF), calm minimal style, warm neutral base.
 * - Theme: light / dark / follow-system.
 * - High-contrast mode for elderly & low-vision users (WCAG 2.1 AA).
 * - Large-font (senior-friendly) mode: scales the root font size so all
 *   rem-based Tailwind classes grow proportionally.
 * - Privacy mask: hides sensitive numeric values until tapped.
 * - Auto-lock: after N minutes of inactivity, the app is locked behind a PIN.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ContrastMode = 'normal' | 'high';
export type FontScale = 'normal' | 'large';

export interface AppPreferences {
  theme: ThemeMode;
  contrast: ContrastMode;
  fontScale: FontScale;
  privacyMask: boolean;
  lockEnabled: boolean;
  lockPin: string; // 4-6 digits; empty means lock screen only asks to unlock.
  lockTimeoutMin: number; // default 15 minutes per design spec.
  /** True once the user completed age verification (出生年份确认). */
  ageVerified: boolean;
  /** True for users under 18: local recording only, AI replies disabled. */
  minorMode: boolean;
}

export const DEFAULT_PREFS: AppPreferences = {
  theme: 'system',
  contrast: 'normal',
  fontScale: 'normal',
  privacyMask: false,
  lockEnabled: false,
  lockPin: '',
  lockTimeoutMin: 15,
  ageVerified: false,
  minorMode: false,
};

const PREFS_KEY = 'moodhub.prefs';

/** Resolve the effective theme name ('light' | 'dark') from a mode. */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function readJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

export function loadPrefs(): AppPreferences {
  return readJSON(localStorage.getItem(PREFS_KEY), DEFAULT_PREFS);
}

export function savePrefs(prefs: AppPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('[MoodHub] failed to persist preferences', e);
  }
}

/**
 * Apply preferences to the document root:
 * - data-theme="light|dark" + toggling the `dark` class for Tailwind.
 * - data-contrast="high" for high-contrast CSS rules.
 * - root font-size scaling for the senior-friendly large-font mode.
 */
export function applyPrefs(prefs: AppPreferences): void {
  const root = document.documentElement;
  const theme = resolveTheme(prefs.theme);

  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');

  root.dataset.contrast = prefs.contrast;
  root.dataset.fontScale = prefs.fontScale;

  // Senior-friendly mode: base 18px (default is 16px, ≥18pt requirement maps to 18px).
  root.style.fontSize = prefs.fontScale === 'large' ? '18px' : '';
}

/** Subscribe to system theme changes so `system` mode stays live. */
export function watchSystemTheme(cb: () => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

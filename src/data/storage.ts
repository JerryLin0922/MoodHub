import type {
  AISettings,
  ChatMessage,
  HealthSample,
  MoodEntry,
} from '../core/types';

/**
 * Split keys per data category.
 * - Writing samples shouldn't rewrite the whole chat log, and vice versa.
 * - API key can live in either localStorage (persistent) or sessionStorage
 *   (cleared when the tab closes), depending on the user's choice.
 */
const K = {
  samples: 'moodhub.samples',
  moods: 'moodhub.moods',
  chat: 'moodhub.chat',
  ai: 'moodhub.ai',
  aiKeyLocal: 'moodhub.aiKey.local',
  aiKeySession: 'moodhub.aiKey.session',
};

/**
 * localStorage quota guard.
 * - Health samples grow unbounded over months/years; keep a rolling window
 *   of the most recent 730 days (2 years) and cap the total item count.
 * - Mood entries are one per day by design (same-day overwrite), so they
 *   stay small; cap them too for safety.
 * - Chat log is already limited to the last 40 messages.
 */
const SAMPLE_MAX_AGE_DAYS = 730;
const SAMPLE_MAX_ITEMS = 20000;
const MOOD_MAX_AGE_DAYS = 730;
const MOOD_MAX_ITEMS = 5000;

function cutoffISO(daysAgo: number): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);
  return cutoff.toISOString().slice(0, 10);
}

/** Trim samples to a bounded rolling window (oldest dropped first). */
function trimSamples(samples: HealthSample[]): HealthSample[] {
  if (samples.length === 0) return samples;
  const cut = cutoffISO(SAMPLE_MAX_AGE_DAYS);
  const recent = samples.filter(s => s.date >= cut);
  return recent.length > SAMPLE_MAX_ITEMS
    ? recent.slice(recent.length - SAMPLE_MAX_ITEMS)
    : recent;
}

/** Trim mood entries to a bounded rolling window. */
function trimMoods(moods: MoodEntry[]): MoodEntry[] {
  if (moods.length === 0) return moods;
  const cut = cutoffISO(MOOD_MAX_AGE_DAYS);
  const recent = moods.filter(m => m.date >= cut);
  return recent.length > MOOD_MAX_ITEMS
    ? recent.slice(recent.length - MOOD_MAX_ITEMS)
    : recent;
}

export interface PersistedState {
  samples: HealthSample[];
  moods: MoodEntry[];
  chat: ChatMessage[];
}

const EMPTY: PersistedState = { samples: [], moods: [], chat: [] };

/** Read a JSON value with a fallback. */
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  providerId: 'deepseek',
  apiKey: '',
  baseUrl: '',
  model: '',
  persistKey: true,
};

/* ---------------- Throttled writer ---------------- */

let pending: PersistedState | null = null;
let timer: number | null = null;

function flushNow() {
  if (!pending) return;
  // Trim before writing so old data never re-bloats the quota.
  const samples = trimSamples(pending.samples);
  const moods = trimMoods(pending.moods);
  try {
    localStorage.setItem(K.samples, JSON.stringify(samples));
    localStorage.setItem(K.moods, JSON.stringify(moods));
    // Keep only the last 40 messages.
    localStorage.setItem(K.chat, JSON.stringify(pending.chat.slice(-40)));
  } catch (e) {
    console.warn('[MoodHub] localStorage write failed (quota?)', e);
    // Degrade: keep only the last 90 days of samples.
    try {
      const cutISO = cutoffISO(90);
      const trimmed = samples.filter(s => s.date >= cutISO);
      localStorage.setItem(K.samples, JSON.stringify(trimmed));
      localStorage.setItem(K.moods, JSON.stringify(moods));
      localStorage.setItem(K.chat, JSON.stringify(pending.chat.slice(-40)));
    } catch {
      // Give up; in-memory state remains intact for this session.
    }
  } finally {
    pending = null;
    timer = null;
  }
}

export const storage = {
  load(): PersistedState {
    return {
      samples: trimSamples(readJSON<HealthSample[]>(K.samples, [])),
      moods: trimMoods(readJSON<MoodEntry[]>(K.moods, [])),
      chat: readJSON<ChatMessage[]>(K.chat, []),
    };
  },

  /** Throttled write, coalesced over 250 ms. */
  save(state: PersistedState) {
    pending = state;
    if (timer != null) return;
    timer = window.setTimeout(flushNow, 250);
  },

  /** Force an immediate write (e.g. on beforeunload). */
  saveNow(state: PersistedState) {
    pending = state;
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    flushNow();
  },

  clear() {
    Object.values(K).forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  },

  /* ---------------- AI settings ---------------- */

  loadAI(): AISettings {
    const base = readJSON<Partial<AISettings>>(K.ai, {});
    const merged: AISettings = { ...DEFAULT_AI_SETTINGS, ...base };

    // Resolve API key storage based on persistKey flag.
    if (merged.persistKey) {
      merged.apiKey = localStorage.getItem(K.aiKeyLocal) ?? '';
      sessionStorage.removeItem(K.aiKeySession);
    } else {
      merged.apiKey = sessionStorage.getItem(K.aiKeySession) ?? '';
    }
    return merged;
  },

  saveAI(settings: AISettings) {
    // Persist everything except the API key in localStorage.
    const { apiKey, ...rest } = settings;
    try {
      localStorage.setItem(K.ai, JSON.stringify(rest));
    } catch (e) {
      console.warn('[MoodHub] failed to persist AI settings', e);
    }

    // API key routing with quota-safety: when the persistent store is full or
    // unavailable, keep the key in the current tab's session scope instead of
    // letting the write throw and break the settings screen.
    try {
      if (settings.persistKey) {
        localStorage.setItem(K.aiKeyLocal, apiKey);
        sessionStorage.removeItem(K.aiKeySession);
      } else {
        sessionStorage.setItem(K.aiKeySession, apiKey);
        localStorage.removeItem(K.aiKeyLocal);
      }
    } catch (e) {
      console.warn('[MoodHub] failed to persist API key, keeping it in-memory only', e);
    }
  },

  clearAIKey() {
    localStorage.removeItem(K.aiKeyLocal);
    sessionStorage.removeItem(K.aiKeySession);
  },
};

/** Flush pending writes before the page unloads. */
export function installUnloadFlush(getState: () => PersistedState) {
  const handler = () => {
    if (pending) storage.saveNow(getState());
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}

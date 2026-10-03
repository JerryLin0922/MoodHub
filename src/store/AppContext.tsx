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
import type {
  AISettings,
  ChatMessage,
  DailyAggregate,
  HealthSample,
  MoodEntry,
} from '../core/types';
import { aggregateDaily } from '../core/aggregate';
import { buildReply } from '../core/rules/treehole';
import { storage, installUnloadFlush } from '../data/storage';
import { chatWithAI, isAIConfigured } from '../data/ai';

export interface AppState {
  samples: HealthSample[];
  moods: MoodEntry[];
  chat: ChatMessage[];
  daily: DailyAggregate[];
  ai: AISettings;

  addSamples: (s: HealthSample[]) => void;
  deleteSample: (id: string) => void;
  saveMood: (m: Omit<MoodEntry, 'updatedAt'>) => void;
  saveAI: (s: AISettings) => void;

  sendMessage: (text: string, images?: string[]) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [samples, setSamples] = useState<HealthSample[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [ai, setAI] = useState<AISettings>(() => storage.loadAI());

  const chatRef = useRef(chat);
  chatRef.current = chat;

  // Initial load from localStorage.
  useEffect(() => {
    const state = storage.load();
    setSamples(state.samples);
    setMoods(state.moods);
    setChat(state.chat);
  }, []);

  // Throttled persistence + unload flush.
  useEffect(() => {
    const cleanup = installUnloadFlush(() => ({
      samples,
      moods,
      chat: chatRef.current,
    }));
    return cleanup;
  }, [samples, moods]);

  const saveState = useCallback(
    (next: Partial<{ samples: HealthSample[]; moods: MoodEntry[]; chat: ChatMessage[] }>) => {
      setSamples(prev => {
        const s = next.samples ?? prev;
        const m = next.moods ?? moods;
        const c = next.chat ?? chatRef.current;
        storage.save({ samples: s, moods: m, chat: c });
        return s;
      });
    },
    [moods]
  );

  const addSamples = useCallback(
    (newSamples: HealthSample[]) => {
      setSamples(prev => {
        const merged = [...prev, ...newSamples];
        storage.save({ samples: merged, moods, chat: chatRef.current });
        return merged;
      });
    },
    [moods]
  );

  const deleteSample = useCallback(
    (id: string) => {
      setSamples(prev => {
        const merged = prev.filter(s => s.id !== id);
        storage.save({ samples: merged, moods, chat: chatRef.current });
        return merged;
      });
    },
    [moods]
  );

  const saveMood = useCallback(
    (m: Omit<MoodEntry, 'updatedAt'>) => {
      setMoods(prev => {
        const entry: MoodEntry = { ...m, updatedAt: new Date().toISOString() };
        const idx = prev.findIndex(x => x.date === entry.date);
        const merged = idx >= 0
          ? prev.map((x, i) => (i === idx ? entry : x))
          : [...prev, entry];
        storage.save({ samples, moods: merged, chat: chatRef.current });
        return merged;
      });
    },
    [samples]
  );

  const saveAI = useCallback(
    (s: AISettings) => {
      setAI(s);
      storage.saveAI(s);
    },
    []
  );

  /** Persist the current dataset; moods are captured via closure. */
  const persist = useCallback(
    (messages: ChatMessage[]) => {
      storage.save({ samples, moods, chat: messages });
    },
    [samples, moods]
  );

  const sendMessage = useCallback(
    async (text: string, images?: string[]) => {
      const trimmed = text.trim();
      if (!trimmed && (!images || images.length === 0)) return;

      const userMsg: ChatMessage = {
        id: nextId('u'),
        role: 'user',
        at: new Date().toISOString(),
        text: trimmed,
        images: images && images.length ? images : undefined,
      };

      const history = [...chatRef.current, userMsg];
      setChat(history);
      persist(history);

      // 1) Rule engine always runs first and stays authoritative for crisis.
      const rule = buildReply(trimmed, aggregateDaily(samples));

      // 2) If crisis, do NOT call the AI at all.
      if (rule.crisis) {
        const messages: ChatMessage[] = [
          ...history,
          {
            id: nextId('a'),
            role: 'assistant',
            at: new Date().toISOString(),
            source: 'rule',
            empathy: rule.empathy,
            suggestions: rule.suggestions,
            followUp: rule.followUp,
            crisis: true,
            resources: rule.resources,
          },
        ];
        setChat(messages);
        persist(messages);
        return;
      }

      // 3) Otherwise try AI when configured.
      let reply: ChatMessage;
      if (ai.enabled && isAIConfigured(ai)) {
        try {
          const aiText = await chatWithAI(trimmed, history.slice(-8), ai);
          reply = {
            id: nextId('a'),
            role: 'assistant',
            at: new Date().toISOString(),
            source: 'ai',
            text: aiText,
          };
        } catch (e) {
          reply = {
            id: nextId('a'),
            role: 'assistant',
            at: new Date().toISOString(),
            source: 'rule',
            empathy: rule.empathy,
            suggestions: rule.suggestions,
            followUp: rule.followUp,
            aiError: e instanceof Error ? e.message : String(e),
          };
        }
      } else {
        reply = {
          id: nextId('a'),
          role: 'assistant',
          at: new Date().toISOString(),
          source: 'rule',
          empathy: rule.empathy,
          suggestions: rule.suggestions,
          followUp: rule.followUp,
        };
      }

      const messages = [...history, reply];
      setChat(messages);
      persist(messages);
    },
    [ai, persist]
  );

  const daily = useMemo(() => aggregateDaily(samples), [samples]);

  const value = useMemo<AppState>(
    () => ({
      samples,
      moods,
      chat,
      daily,
      ai,
      addSamples,
      deleteSample,
      saveMood,
      saveAI,
      sendMessage,
    }),
    [samples, moods, chat, daily, ai, addSamples, deleteSample, saveMood, saveAI, sendMessage]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

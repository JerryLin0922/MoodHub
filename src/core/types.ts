/** Canonical health metric types (internal naming). */
export type HealthMetricType =
  | 'sleep_duration'      // minutes
  | 'sleep_efficiency'    // %
  | 'resting_heart_rate'  // bpm
  | 'heart_rate'          // bpm
  | 'hrv'                 // ms
  | 'spo2'                // %
  | 'stress'              // 0-100
  | 'steps'               // count
  | 'exercise_minutes';   // minutes

/** Data provenance, useful for tracing. */
export type HealthSource =
  | 'csv' | 'json' | 'manual'
  | 'healthconnect' | 'healthkit' | 'huawei';

export interface HealthSample {
  id: string;
  ts: string;              // ISO string, local timezone
  date: string;            // YYYY-MM-DD
  type: HealthMetricType;
  value: number;
  unit: string;
  source: HealthSource;
}

export interface MoodEntry {
  date: string;            // YYYY-MM-DD (same-day overwrite)
  mood: number;            // 1-5
  stress: number;          // 0-10
  sleepQuality: number;    // 1-5
  note: string;
  updatedAt: string;       // ISO
}

export interface DailyAggregate {
  date: string;
  sleepDuration?: number;
  sleepEfficiency?: number;
  restingHeartRate?: number;
  heartRate?: number;
  hrv?: number;
  stress?: number;
  spo2?: number;
  steps?: number;
  exerciseMinutes?: number;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatSuggestion {
  label: string;
  detail: string;
}

export interface CrisisResource {
  name: string;
  contact: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  at: string;

  /** User body, or assistant plain-text reply when source === 'ai'. */
  text?: string;
  /** Where the assistant reply came from. */
  source?: 'rule' | 'ai';
  /** Structured fields only present when source === 'rule'. */
  empathy?: string;
  suggestions?: ChatSuggestion[];
  followUp?: string;
  /** True if the reply is a crisis response (rule engine only). */
  crisis?: boolean;
  resources?: CrisisResource[];
  /** If an AI call failed and we fell back to the rule engine, keep the message. */
  aiError?: string;
}

/* ---------------- AI provider settings ---------------- */

export type AIProviderKind = 'openai-compatible' | 'gemini';

export interface AIProviderPreset {
  id: string;
  name: string;
  kind: AIProviderKind;
  baseUrl: string;
  models: string[];
  defaultModel: string;
  docsUrl: string;
  keyPlaceholder: string;
  note?: string;
}

export interface AISettings {
  /** Whether to use the AI for tree-hole replies. When off, rule engine only. */
  enabled: boolean;
  providerId: string;
  apiKey: string;
  /** Empty string means "use the preset default". */
  baseUrl: string;
  /** Empty string means "use the preset default". */
  model: string;
  /** If true, the API key is stored in localStorage; otherwise sessionStorage. */
  persistKey: boolean;
}

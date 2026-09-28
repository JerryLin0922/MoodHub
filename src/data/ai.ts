import type { AISettings, ChatMessage } from '../core/types';
import { getPreset } from './aiProviders';
import { detectCrisis } from '../core/rules/treehole';

export function isAIConfigured(ai: AISettings): boolean {
  return ai.enabled && !!ai.apiKey.trim();
}

interface ChatPayload {
  model: string;
  temperature: number;
  max_tokens: number;
  messages: { role: string; content: string }[];
}

/** AbortController-based timeout so a hung provider never blocks the UI. */
const REQUEST_TIMEOUT_MS = 20_000;

async function fetchWithTimeout(input: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('AI 请求超时（20s），已改用本地规则回复');
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Turn recent chat history into messages for the model. */
function buildMessages(userText: string, history: ChatMessage[]): ChatPayload['messages'] {
  const system: string =
    '你是一个温暖、克制的心理陪伴助手。' +
    '规则：1) 不诊断、不处方、不说教；2) 回复 2-4 句话，口语化；3) ' +
    '若用户出现自杀/自残等危机信号，必须优先建议联系专业心理援助热线（12356 等），' +
    '不要试图替代专业帮助；4) 用户数据仅在本机使用。';

  const messages = history
    .slice(-8)
    .filter(m => m.text || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text ?? '',
    }));

  messages.push({ role: 'user', content: userText });
  return [{ role: 'system', content: system }, ...messages];
}

/** Try the configured provider; throw on network/HTTP errors. */
export async function chatWithAI(
  userText: string,
  history: ChatMessage[],
  ai: AISettings
): Promise<string> {
  // Safety: never route crisis text to the model output; keep local rule first.
  if (detectCrisis(userText)) {
    throw new Error('crisis_guard');
  }

  const preset = getPreset(ai.providerId);
  const baseUrl = (ai.baseUrl.trim() || preset?.baseUrl || '').replace(/\/+$/, '');
  const model = ai.model.trim() || preset?.defaultModel || '';
  if (!baseUrl || !model) throw new Error('missing_provider_config');

  const payload: ChatPayload = {
    model,
    temperature: 0.7,
    max_tokens: 400,
    messages: buildMessages(userText, history),
  };

  if (preset?.kind === 'gemini') {
    return callGemini(baseUrl, model, payload, ai.apiKey);
  }
  return callOpenAICompatible(baseUrl, payload, ai.apiKey);
}

async function callOpenAICompatible(
  baseUrl: string,
  payload: ChatPayload,
  apiKey: string
): Promise<string> {
  const url = baseUrl.includes('/chat/completions')
    ? baseUrl
    : `${baseUrl}/chat/completions`;

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('empty_ai_response');
  return text;
}

async function callGemini(
  baseUrl: string,
  model: string,
  payload: ChatPayload,
  apiKey: string
): Promise<string> {
  const url = `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const contents = payload.messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('empty_ai_response');
  return text;
}

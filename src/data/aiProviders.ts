import type { AIProviderPreset } from '../core/types';

/**
 * Built-in provider presets.
 * baseUrl must point at an OpenAI-compatible chat/completions endpoint,
 * or a Gemini v1beta endpoint.
 */
export const PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    kind: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    docsUrl: 'https://platform.deepseek.com/docs',
    keyPlaceholder: 'sk-…',
  },
  {
    id: 'qwen',
    name: '通义千问',
    kind: 'openai-compatible',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max'],
    defaultModel: 'qwen-plus',
    docsUrl: 'https://help.aliyun.com/zh/dashscope/',
    keyPlaceholder: 'sk-…',
  },
  {
    id: 'hunyuan',
    name: '腾讯混元',
    kind: 'openai-compatible',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    models: ['hunyuan-turbo', 'hunyuan-standard', 'hunyuan-lite'],
    defaultModel: 'hunyuan-lite',
    docsUrl: 'https://cloud.tencent.com/document/product/1729',
    keyPlaceholder: 'AKID…',
    note: '浏览器直连混元受 CORS 限制，建议在 Electron 里使用，或部署代理。',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    kind: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    defaultModel: 'gemini-1.5-flash',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    keyPlaceholder: 'AIza…',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o'],
    defaultModel: 'gpt-4o-mini',
    docsUrl: 'https://platform.openai.com/docs',
    keyPlaceholder: 'sk-…',
  },
  {
    id: 'custom',
    name: '自定义',
    kind: 'openai-compatible',
    baseUrl: '',
    models: [],
    defaultModel: '',
    docsUrl: '',
    keyPlaceholder: '你的 API Key',
  },
];

export function getPreset(id: string): AIProviderPreset | undefined {
  return PROVIDER_PRESETS.find(p => p.id === id);
}

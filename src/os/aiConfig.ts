export type AIProvider = 'pollinations' | 'openai' | 'openrouter' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  endpoint: string;
}

const STORAGE_KEY = 'vingrape-ai-config';

const PROVIDER_DEFAULTS: Record<AIProvider, { endpoint: string; model: string; needsKey: boolean }> = {
  pollinations: {
    endpoint: 'https://text.pollinations.ai/openai',
    model: 'openai',
    needsKey: false,
  },
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    needsKey: true,
  },
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openai/gpt-4o-mini',
    needsKey: true,
  },
  custom: {
    endpoint: '',
    model: '',
    needsKey: false,
  },
};

export function getProviderDefaults(provider: AIProvider) {
  return PROVIDER_DEFAULTS[provider];
}

export function loadAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AIConfig;
      return parsed;
    }
  } catch {
    // ignore
  }
  return {
    provider: 'pollinations',
    model: 'openai',
    apiKey: '',
    endpoint: 'https://text.pollinations.ai/openai',
  };
}

export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function buildHeaders(config: AIConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  return headers;
}

export function buildBody(config: AIConfig, systemPrompt: string, messages: { role: string; content: string }[]): string {
  return JSON.stringify({
    model: config.model || 'openai',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.8,
    max_tokens: 4000,
  });
}

export function extractContent(data: unknown): string {
  const d = data as { choices?: { message?: { content?: string } }[] };
  const content = d?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI returned no content');
  return content;
}

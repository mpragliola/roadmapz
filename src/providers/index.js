import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const PROVIDER_REGISTRY = {
  anthropic: {
    createProvider: (apiKey) => createAnthropic({ apiKey, dangerouslyAllowBrowser: true }),
    defaultModel: 'claude-sonnet-4-6',
    keyVar: 'ANTHROPIC_API_KEY',
  },
  openai: {
    createProvider: (apiKey) => createOpenAI({ apiKey, dangerouslyAllowBrowser: true }),
    defaultModel: 'gpt-4o',
    keyVar: 'OPENAI_API_KEY',
  },
  google: {
    createProvider: (apiKey) => createGoogleGenerativeAI({ apiKey, dangerouslyAllowBrowser: true }),
    defaultModel: 'gemini-2.0-flash',
    keyVar: 'GOOGLE_API_KEY',
  },
};

export function resolveConfig(env = import.meta.env) {
  const providerName = env.AI_PROVIDER;
  const entry = PROVIDER_REGISTRY[providerName];

  if (!providerName || !entry) {
    return {
      error: `AI_PROVIDER must be one of: ${Object.keys(PROVIDER_REGISTRY).join(', ')}. Got: "${providerName ?? ''}"`,
    };
  }

  const apiKey = env[entry.keyVar];
  if (!apiKey) {
    return { error: `${entry.keyVar} is required when AI_PROVIDER=${providerName}` };
  }

  return {
    provider: entry.createProvider(apiKey),
    model: env.AI_MODEL || entry.defaultModel,
    providerName,
  };
}

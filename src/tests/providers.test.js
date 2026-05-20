import { resolveConfig, PROVIDER_REGISTRY } from '../providers/index.js';

describe('PROVIDER_REGISTRY', () => {
  it('defines anthropic, openai, and google', () => {
    expect(PROVIDER_REGISTRY).toHaveProperty('anthropic');
    expect(PROVIDER_REGISTRY).toHaveProperty('openai');
    expect(PROVIDER_REGISTRY).toHaveProperty('google');
  });

  it('each entry has createProvider, defaultModel, and keyVar', () => {
    for (const [name, entry] of Object.entries(PROVIDER_REGISTRY)) {
      expect(typeof entry.createProvider, `${name}.createProvider`).toBe('function');
      expect(typeof entry.defaultModel, `${name}.defaultModel`).toBe('string');
      expect(entry.keyVar, `${name}.keyVar`).toMatch(/^VITE_/);
    }
  });
});

describe('resolveConfig', () => {
  it('returns error when VITE_AI_PROVIDER is missing', () => {
    const result = resolveConfig({});
    expect(result.error).toMatch(/VITE_AI_PROVIDER/);
  });

  it('returns error when VITE_AI_PROVIDER is unknown', () => {
    const result = resolveConfig({ VITE_AI_PROVIDER: 'unknown_provider' });
    expect(result.error).toMatch(/VITE_AI_PROVIDER/);
  });

  it('returns error naming the missing key var', () => {
    const result = resolveConfig({ VITE_AI_PROVIDER: 'anthropic' });
    expect(result.error).toMatch(/VITE_ANTHROPIC_API_KEY/);
  });

  it('returns config with provider default model when VITE_AI_MODEL is absent', () => {
    const result = resolveConfig({
      VITE_AI_PROVIDER: 'anthropic',
      VITE_ANTHROPIC_API_KEY: 'sk-test',
    });
    expect(result.error).toBeUndefined();
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.providerName).toBe('anthropic');
    expect(typeof result.provider).toBe('function');
  });

  it('uses VITE_AI_MODEL when provided', () => {
    const result = resolveConfig({
      VITE_AI_PROVIDER: 'anthropic',
      VITE_ANTHROPIC_API_KEY: 'sk-test',
      VITE_AI_MODEL: 'claude-opus-4-7',
    });
    expect(result.model).toBe('claude-opus-4-7');
  });

  it('resolves openai config correctly', () => {
    const result = resolveConfig({
      VITE_AI_PROVIDER: 'openai',
      VITE_OPENAI_API_KEY: 'sk-test',
    });
    expect(result.error).toBeUndefined();
    expect(result.model).toBe('gpt-4o');
  });
});

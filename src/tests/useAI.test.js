import { normalizeUsage } from '../hooks/useAI.js';

describe('normalizeUsage', () => {
  it('maps Vercel AI SDK usage fields to the internal shape', () => {
    const result = normalizeUsage({ promptTokens: 100, completionTokens: 200 }, null);
    expect(result).toEqual({
      input_tokens: 100,
      output_tokens: 200,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    });
  });

  it('extracts Anthropic cache tokens from provider metadata', () => {
    const metadata = {
      anthropic: { cacheReadInputTokens: 50, cacheCreationInputTokens: 30 },
    };
    const result = normalizeUsage({ promptTokens: 100, completionTokens: 200 }, metadata);
    expect(result.cache_read_input_tokens).toBe(50);
    expect(result.cache_creation_input_tokens).toBe(30);
  });

  it('returns zeros for all fields when usage is null', () => {
    const result = normalizeUsage(null, null);
    expect(result).toEqual({
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    });
  });

  it('returns zero cache tokens when provider metadata is absent', () => {
    const result = normalizeUsage({ promptTokens: 10, completionTokens: 20 }, undefined);
    expect(result.cache_read_input_tokens).toBe(0);
    expect(result.cache_creation_input_tokens).toBe(0);
  });
});

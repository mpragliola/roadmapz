import { normalizeUsage, generateRoadmap } from '../hooks/useAI.js';

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

// ── generateRoadmap tests ────────────────────────────────────────────────────

const FINAL_ROADMAP = {
  title: 'Frontend Development',
  sections: [
    { id: 's1', label: 'Basics', nodes: [{ id: 'n1', label: 'HTML', level: 'beginner' }] },
    { id: 's2', label: 'CSS',    nodes: [{ id: 'n2', label: 'Selectors', level: 'beginner' }] },
  ],
  edges: [{ source: 'n1', target: 'n2' }],
};

vi.mock('ai', () => ({
  streamText: vi.fn(),
  Output: { object: vi.fn().mockReturnValue({}) },
}));

vi.mock('../providers/index.js', () => ({
  resolveConfig: () => ({ provider: vi.fn().mockReturnValue('mock-model'), model: 'mock' }),
}));

vi.mock('../utils/roadmapSchema.js', () => ({ roadmapSchema: {} }));

function makeStreamResult(partials, finalObject) {
  return {
    partialOutputStream: (async function* () {
      for (const p of partials) yield p;
    })(),
    object: Promise.resolve(structuredClone(finalObject)),
    usage: Promise.resolve({ promptTokens: 100, completionTokens: 200 }),
    experimental_providerMetadata: Promise.resolve(null),
  };
}

describe('generateRoadmap', () => {
  beforeEach(async () => {
    const { streamText } = await import('ai');
    streamText.mockReset();
  });

  it('returns a roadmap with section colors applied', async () => {
    const { streamText } = await import('ai');
    streamText.mockReturnValue(
      makeStreamResult(
        [{ sections: [], edges: [] }, { sections: FINAL_ROADMAP.sections, edges: [] }],
        FINAL_ROADMAP
      )
    );

    const { roadmap } = await generateRoadmap('Frontend', '', undefined);

    expect(roadmap.title).toBe('Frontend Development');
    expect(roadmap.sections[0].color).toBeDefined();
    expect(roadmap.sections[1].color).toBeDefined();
    // colors cycle through the palette — first two are distinct
    expect(roadmap.sections[0].color).not.toBe(roadmap.sections[1].color);
  });

  it('calls onProgress with filled section count', async () => {
    const { streamText } = await import('ai');
    streamText.mockReturnValue(
      makeStreamResult(
        [
          { sections: [], edges: [] },
          { sections: [FINAL_ROADMAP.sections[0]], edges: [] },
          { sections: FINAL_ROADMAP.sections, edges: [] },
        ],
        FINAL_ROADMAP
      )
    );

    const calls = [];
    await generateRoadmap('Frontend', '', (filled, total) => calls.push({ filled, total }));

    expect(calls.some((c) => c.filled === 1)).toBe(true);
    expect(calls.some((c) => c.filled === 2)).toBe(true);
    expect(calls.every((c) => c.total === 6)).toBe(true);
  });

  it('returns normalised usage', async () => {
    const { streamText } = await import('ai');
    streamText.mockReturnValue(makeStreamResult([], FINAL_ROADMAP));

    const { usage } = await generateRoadmap('Frontend', '', undefined);

    expect(usage.input_tokens).toBe(100);
    expect(usage.output_tokens).toBe(200);
  });
});

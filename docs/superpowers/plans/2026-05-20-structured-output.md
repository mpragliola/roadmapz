# Structured Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace prompt-engineering JSON extraction with provider-native structured output using Vercel AI SDK's `Output.object()` and a Zod schema.

**Architecture:** Add `zod` and define a `roadmapSchema` in a new `src/utils/roadmapSchema.js`. Switch `generateRoadmap` from `textStream` to `partialOutputStream` via `streamText` + `Output.object({ schema: roadmapSchema })`. Delete `parseRoadmapJson` entirely — Zod validation replaces it. Apply `SECTION_COLORS` inline after the stream resolves.

**Tech Stack:** Vercel AI SDK v6 (`ai`), `@ai-sdk/anthropic`, `zod`, Vitest

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/utils/roadmapSchema.js` | Zod schema — single source of truth for roadmap shape |
| Create | `src/tests/roadmapSchema.test.js` | Schema validation tests |
| Modify | `package.json` | Add `zod` dependency |
| Modify | `src/providers/index.js` | Enable `structuredOutputMode: 'outputFormat'` for Anthropic |
| Modify | `src/hooks/useAI.js` | Switch to `Output.object()`, remove `parseRoadmapJson`, apply colors |
| Modify | `src/tests/useAI.test.js` | Add `generateRoadmap` tests with mocked `partialOutputStream` |
| Delete | `src/utils/parseRoadmap.js` | Replaced by Zod schema |
| Delete | `src/tests/parseRoadmap.test.js` | Tests for deleted file |

---

## Task 1: Install zod and create the roadmap schema

**Files:**
- Modify: `package.json`
- Create: `src/utils/roadmapSchema.js`

- [ ] **Step 1: Install zod**

```bash
npm install zod
```

Expected: `zod` appears in `package.json` dependencies.

- [ ] **Step 2: Create `src/utils/roadmapSchema.js`**

```js
import { z } from 'zod';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'optional'];

export const roadmapSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      nodes: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          level: z.enum(LEVELS),
        })
      ),
    })
  ),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
    })
  ),
});
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/utils/roadmapSchema.js
git commit -m "feat: add roadmapSchema zod definition"
```

---

## Task 2: Test the roadmap schema

**Files:**
- Create: `src/tests/roadmapSchema.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/tests/roadmapSchema.test.js
import { roadmapSchema } from '../utils/roadmapSchema.js';

const VALID = {
  title: 'Frontend Development',
  sections: [
    {
      id: 's1',
      label: 'Basics',
      nodes: [
        { id: 'n1', label: 'HTML', level: 'beginner' },
        { id: 'n2', label: 'CSS', level: 'beginner' },
      ],
    },
  ],
  edges: [{ source: 'n1', target: 'n2' }],
};

describe('roadmapSchema', () => {
  it('accepts a valid roadmap', () => {
    expect(() => roadmapSchema.parse(VALID)).not.toThrow();
  });

  it('returns the parsed object with correct shape', () => {
    const result = roadmapSchema.parse(VALID);
    expect(result.title).toBe('Frontend Development');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].nodes[0].level).toBe('beginner');
  });

  it('rejects a node missing the level field', () => {
    const bad = structuredClone(VALID);
    delete bad.sections[0].nodes[0].level;
    expect(() => roadmapSchema.parse(bad)).toThrow();
  });

  it('rejects an invalid level value', () => {
    const bad = structuredClone(VALID);
    bad.sections[0].nodes[0].level = 'expert';
    expect(() => roadmapSchema.parse(bad)).toThrow();
  });

  it('rejects missing sections', () => {
    const { sections: _s, ...bad } = VALID;
    expect(() => roadmapSchema.parse(bad)).toThrow();
  });

  it('rejects missing edges', () => {
    const { edges: _e, ...bad } = VALID;
    expect(() => roadmapSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run and verify they fail (schema file missing)**

```bash
npm test -- roadmapSchema
```

Expected: FAIL — `roadmapSchema` not found (the file exists now so they should actually pass — run to confirm PASS).

- [ ] **Step 3: Run tests and confirm all pass**

```bash
npm test -- roadmapSchema
```

Expected: 6 passing tests.

- [ ] **Step 4: Commit**

```bash
git add src/tests/roadmapSchema.test.js
git commit -m "test: add roadmapSchema validation tests"
```

---

## Task 3: Enable native structured output on the Anthropic provider

**Files:**
- Modify: `src/providers/index.js`

The Anthropic AI SDK provider supports `structuredOutputMode: 'outputFormat'` which routes to Anthropic's native `output_config` grammar-constrained decoding instead of the tool-use fallback. Pass it at provider creation time.

- [ ] **Step 1: Update `createAnthropic` call in `src/providers/index.js`**

Replace the existing `anthropic` entry:

```js
anthropic: {
  createProvider: (apiKey) =>
    createAnthropic({ apiKey, dangerouslyAllowBrowser: true, structuredOutputMode: 'outputFormat' }),
  defaultModel: 'claude-sonnet-4-6',
  keyVar: 'ANTHROPIC_API_KEY',
},
```

The full file after the change:

```js
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const PROVIDER_REGISTRY = {
  anthropic: {
    createProvider: (apiKey) =>
      createAnthropic({ apiKey, dangerouslyAllowBrowser: true, structuredOutputMode: 'outputFormat' }),
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
```

- [ ] **Step 2: Run existing provider tests**

```bash
npm test -- providers
```

Expected: all passing (the test mocks `createAnthropic` so this is a smoke check).

- [ ] **Step 3: Commit**

```bash
git add src/providers/index.js
git commit -m "feat: enable native structured output mode for Anthropic provider"
```

---

## Task 4: Update `generateRoadmap` to use `Output.object()`

**Files:**
- Modify: `src/hooks/useAI.js`

- [ ] **Step 1: Rewrite `src/hooks/useAI.js`**

The `SECTION_COLORS` array moves here from the deleted `parseRoadmap.js`. The system prompt loses the inline JSON schema example and the "Return ONLY valid JSON" instruction — the schema is now enforced by the SDK. The `textStream` loop becomes a `partialOutputStream` loop tracking section fill progress. After the stream, `result.object` holds the fully-validated typed roadmap.

```js
import { streamText, Output } from 'ai';
import { resolveConfig } from '../providers/index.js';
import { roadmapSchema } from '../utils/roadmapSchema.js';

const SECTION_COLORS = [
  '#e8f4fd',
  '#fef9e7',
  '#e8f8f5',
  '#fdf2f8',
  '#f4ecf7',
  '#fef5e4',
  '#eafaf1',
  '#fdedec',
];

const ROADMAP_SYSTEM = `You are a curriculum designer creating structured learning roadmaps.

This roadmap must represent a realistic, actionable career or learning progression — from 
absolute beginner concepts to advanced mastery. Structure it the way an experienced practitioner 
would guide a newcomer, following the same philosophy as roadmap.sh.

Node level values — use exactly one per node:
- "beginner"      — foundational concepts everyone must learn first
- "intermediate"  — builds on basics, required for serious real-world work
- "advanced"      — deep expertise for specialists or senior practitioners
- "optional"      — enrichment or broadening topics, "nice to have" but not 
                    on the critical path

Rules:
- 5 to 8 sections representing major groupings (Prerequisites, Core Concepts, Tooling, Advanced Topics, Ecosystem, Best Practices)
- 2 to 6 nodes per section
- Every node must have a "level" field
- Edges define the learning order — prerequisites point to what they unlock
- Overall progression goes beginner → intermediate → advanced; optional topics enrich at any level
- All ids must be unique strings across the entire roadmap`;

const EXPLANATION_SYSTEM = `You are a curriculum designer explaining concepts from learning roadmaps.

Write a thorough explanation covering:
1. What it is and why it matters in this roadmap's context
2. Key concepts and terminology
3. How to get started (concrete first steps)
4. Common pitfalls or misconceptions

Format your response in Markdown using headers, bold text, and bullet points where appropriate.
Target length: 300–500 words. Be practical and concrete.`;

export function normalizeUsage(usage, metadata) {
  return {
    input_tokens: usage?.promptTokens ?? 0,
    output_tokens: usage?.completionTokens ?? 0,
    cache_read_input_tokens: metadata?.anthropic?.cacheReadInputTokens ?? 0,
    cache_creation_input_tokens: metadata?.anthropic?.cacheCreationInputTokens ?? 0,
  };
}

export async function generateRoadmap(topic, context, onProgress) {
  const { provider, model } = resolveConfig();
  const contextLine = context ? `\n\nAdditional context from the user: ${context}` : '';

  const EXPECTED_SECTIONS = 6;

  const result = streamText({
    model: provider(model),
    system: ROADMAP_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Generate a learning roadmap for: "${topic}"
        Model the structure after how roadmap.sh organises "${topic}" — realistic and 
        battle-tested.${contextLine}`,
      },
    ],
    output: Output.object({ schema: roadmapSchema }),
    maxTokens: 4096,
    providerOptions: {
      anthropic: { cacheControl: { type: 'ephemeral' } },
    },
  });

  for await (const partial of result.partialOutputStream) {
    const filled = partial.sections?.filter((s) => s?.nodes?.length > 0).length ?? 0;
    onProgress?.(filled, EXPECTED_SECTIONS);
  }

  const roadmap = await result.object;
  roadmap.sections.forEach((s, i) => {
    s.color = SECTION_COLORS[i % SECTION_COLORS.length];
  });

  const usage = await result.usage;
  const metadata = await result.experimental_providerMetadata;

  return { roadmap, usage: normalizeUsage(usage, metadata) };
}

export async function explainNode(topic, nodeLabel, onChunk) {
  const { provider, model } = resolveConfig();

  const result = streamText({
    model: provider(model),
    system: EXPLANATION_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Roadmap topic: "${topic}"\nConcept to explain: "${nodeLabel}"`,
      },
    ],
    maxTokens: 1024,
    providerOptions: {
      anthropic: { cacheControl: { type: 'ephemeral' } },
    },
  });

  for await (const chunk of result.textStream) {
    onChunk(chunk);
  }

  const usage = await result.usage;
  const metadata = await result.experimental_providerMetadata;

  return { usage: normalizeUsage(usage, metadata) };
}
```

- [ ] **Step 2: Run the existing `useAI` tests to confirm `normalizeUsage` still passes**

```bash
npm test -- useAI
```

Expected: 4 passing (the `normalizeUsage` tests haven't changed).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAI.js
git commit -m "feat: switch generateRoadmap to streamText Output.object with Zod schema"
```

---

## Task 5: Add `generateRoadmap` tests

**Files:**
- Modify: `src/tests/useAI.test.js`

- [ ] **Step 1: Add `generateRoadmap` tests to `src/tests/useAI.test.js`**

Append the following to the existing file (keep all existing `normalizeUsage` tests intact):

```js
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateRoadmap, normalizeUsage } from '../hooks/useAI.js';

// ── mock 'ai' ───────────────────────────────────────────────────────────────
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

// ── mock '../utils/roadmapSchema.js' ────────────────────────────────────────
vi.mock('../utils/roadmapSchema.js', () => ({ roadmapSchema: {} }));

// ── helpers ─────────────────────────────────────────────────────────────────
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
  beforeEach(() => {
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
```

- [ ] **Step 2: Run the tests**

```bash
npm test -- useAI
```

Expected: all tests pass (4 original + 3 new = 7 total).

- [ ] **Step 3: Commit**

```bash
git add src/tests/useAI.test.js
git commit -m "test: add generateRoadmap tests for Output.object streaming"
```

---

## Task 6: Delete parseRoadmap files

**Files:**
- Delete: `src/utils/parseRoadmap.js`
- Delete: `src/tests/parseRoadmap.test.js`

- [ ] **Step 1: Delete both files**

```bash
git rm src/utils/parseRoadmap.js src/tests/parseRoadmap.test.js
```

- [ ] **Step 2: Run the full test suite to confirm nothing references deleted files**

```bash
npm test
```

Expected: all tests pass, no import errors.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: delete parseRoadmap — replaced by Zod schema + Output.object"
```

---

## Self-Review

**Spec coverage:**
- ✅ Add `zod` — Task 1
- ✅ `roadmapSchema.js` created — Task 1
- ✅ Schema tests — Task 2
- ✅ `structuredOutputMode: 'outputFormat'` on Anthropic — Task 3
- ✅ `streamText` + `Output.object()` — Task 4
- ✅ `partialOutputStream` progress tracking — Task 4
- ✅ `SECTION_COLORS` applied after stream — Task 4
- ✅ System prompt trimmed of inline JSON — Task 4
- ✅ `parseRoadmapJson` import removed — Task 4
- ✅ `generateRoadmap` tests updated — Task 5
- ✅ `parseRoadmap.js` deleted — Task 6
- ✅ `parseRoadmap.test.js` deleted — Task 6

**Placeholder scan:** No TBDs, no "similar to task N", all code blocks complete.

**Type consistency:** `roadmapSchema` exported from `roadmapSchema.js`, imported in `useAI.js` and test mocks — consistent. `SECTION_COLORS` defined once in `useAI.js`, not imported from anywhere else.

# Structured Output via Zod + streamText Output.object()

**Date:** 2026-05-20
**Status:** Approved

## Goal

Replace prompt-engineering JSON extraction with provider-native structured output, using the Vercel AI SDK's `Output.object()` API and Zod schema validation.

## Background

The current `generateRoadmap` implementation uses `streamText` and asks the model via system prompt to return raw JSON. Output is parsed by `parseRoadmapJson` which strips markdown fences and calls `JSON.parse`. This is fragile: any stray text breaks the parse.

Vercel AI SDK (v6+) supports `streamText` with `output: Output.object({ schema })`, routing to:
- Anthropic: native `output_config` grammar-constrained decoding (via `structuredOutputMode: 'outputFormat'`)
- OpenAI: native `response_format: json_schema`
- Google: native `response_schema`

## Architecture

### New file: `src/utils/roadmapSchema.js`

Single source of truth for the roadmap data shape. Replaces both the inline JSON example in the system prompt and the structural validation in `parseRoadmapJson`.

```js
import { z } from 'zod';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'optional'];

export const roadmapSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    id: z.string(),
    label: z.string(),
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      level: z.enum(LEVELS),
    })),
  })),
  edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
  })),
});
```

### `src/providers/index.js`

Add `structuredOutputMode: 'outputFormat'` to `createAnthropic` config. OpenAI and Google need no changes.

### `src/hooks/useAI.js` — `generateRoadmap`

- Import `Output` from `ai` and `roadmapSchema`
- Pass `output: Output.object({ schema: roadmapSchema })` to `streamText`
- Replace `textStream` loop with `partialOutputStream` loop for progress tracking
- Progress: count sections with at least one node, out of expected 6
- After stream: apply `SECTION_COLORS` to `result.object.sections`
- Remove system prompt inline JSON schema example and fence-stripping instructions
- Remove `parseRoadmapJson` import

### Deleted files

- `src/utils/parseRoadmap.js`
- `src/tests/parseRoadmap.test.js`

### Updated tests

- `src/tests/useAI.test.js`: mock `partialOutputStream` instead of `textStream`
- New `src/tests/roadmapSchema.test.js`: validate schema accepts valid fixture, rejects missing/invalid `level`

## Error Handling

`streamText` with `Output.object()` throws `AI_NoObjectGeneratedError` on refusal or truncation. The existing `try/catch` in the `useAI` hook covers this — no new error boundary needed.

## Dependencies

Add `zod` to `dependencies` in `package.json`.

## Non-goals

- No changes to `explainNode` (returns prose, not structured data)
- No changes to provider selection or config UI
- No changes to `SECTION_COLORS` values

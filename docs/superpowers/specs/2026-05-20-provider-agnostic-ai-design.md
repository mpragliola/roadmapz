# Provider-Agnostic AI — Design Spec

**Date:** 2026-05-20  
**Status:** Approved

---

## Goal

Replace the hard-coded Anthropic SDK integration with a provider-agnostic layer using the Vercel AI SDK. Provider, model, and API key are configured entirely via `.env` — no UI controls for these. Adding a new provider in future requires touching only one file and `.env`.

---

## Configuration

Three environment variables control the AI backend:

```
VITE_AI_PROVIDER=anthropic          # anthropic | openai | google (extensible)
VITE_AI_MODEL=claude-sonnet-4-6     # any valid model id for the chosen provider
VITE_ANTHROPIC_API_KEY=sk-ant-...   # provider-specific key var
```

The API key variable name follows the convention `VITE_<PROVIDER_UPPER>_API_KEY`. This preserves the existing `VITE_ANTHROPIC_API_KEY` and allows multiple provider keys to coexist in the same `.env` without conflict.

**Startup validation:** if `VITE_AI_PROVIDER` is missing, or the matching key var is empty/absent, the app renders `ConfigErrorPage` — a hard error screen listing exactly which vars to add, with no API call attempted.

**Default model:** if `VITE_AI_MODEL` is not set, the provider registry supplies a sensible default for that provider.

---

## Architecture

### New / changed files

| File | Action | Purpose |
|---|---|---|
| `src/providers/index.js` | **New** | Registry: maps provider name → Vercel AI SDK factory + default model |
| `src/hooks/useAI.js` | **Replaces** `useClaude.js` | Same two exported functions, internals use Vercel AI SDK `streamText` |
| `src/components/ConfigErrorPage.jsx` | **Replaces** `ApiKeyModal.jsx` | Hard error page shown when env config is missing |
| `src/App.jsx` | **Modified** | Remove apiKey state, model selector, MODELS import, modal logic; adapt token stats |

### Deleted

- `src/hooks/useClaude.js`
- `src/components/ApiKeyModal.jsx`
- `ModelSelector` component (inline in `App.jsx`)
- "API Key" change button from header

### Unchanged

All other files (`RoadmapCanvas`, `TopicInput`, `ExplanationPanel`, `TopicNode`, `SectionNode`, `parseRoadmap`, `layout`, `prompts`, tests) are untouched.

---

## Provider Registry (`src/providers/index.js`)

```js
// Structure — not final syntax
{
  anthropic: {
    createProvider: (apiKey) => createAnthropic({ apiKey, dangerouslyAllowBrowser: true }),
    defaultModel: 'claude-sonnet-4-6',
  },
  openai: {
    createProvider: (apiKey) => createOpenAI({ apiKey, dangerouslyAllowBrowser: true }),
    defaultModel: 'gpt-4o',
  },
  google: {
    createProvider: (apiKey) => createGoogleGenerativeAI({ apiKey }),
    defaultModel: 'gemini-2.0-flash',
  },
}
```

Adding a new provider = install its `@ai-sdk/<name>` package, add one entry here, update `.env`.

---

## `useAI.js` — Streaming Interface

Exports the same two functions as `useClaude.js` so call sites in `App.jsx` need only the import path updated:

```js
export async function generateRoadmap(topic, context, onProgress)
export async function explainNode(topic, nodeLabel, onChunk)
```

- Provider, model, and API key are read from `import.meta.env` inside the module — callers pass no credentials.
- Streaming via `streamText` from `ai`, iterating `result.textStream`.
- Usage returned from `result.usage` (a Promise resolved after stream ends), normalized to `{ promptTokens, completionTokens, cacheReadTokens?, cacheWriteTokens? }`.
- Cache token fields are populated only when `VITE_AI_PROVIDER=anthropic` via `experimental_providerMetadata`.

---

## Token Badge Behaviour

The existing `TokenBadge` component is adapted to the normalized usage shape:

| Field | All providers | Anthropic only |
|---|---|---|
| `↑` input tokens | ✓ | ✓ |
| `↓` output tokens | ✓ | ✓ |
| `💾` cache hit % | — | ✓ (hidden otherwise) |

No structural change to `TokenBadge` — it already conditionally renders the cache row.

---

## `ConfigErrorPage` — Error State

Shown when startup validation fails. Displays:

- Which `VITE_*` vars are missing
- An `.env` snippet the user can copy-paste
- No retry mechanism — user must restart the dev server after fixing `.env`

Replaces `ApiKeyModal` entirely; `localStorage` key management is removed.

---

## New Dependencies

```
ai                    # Vercel AI SDK core
@ai-sdk/anthropic
@ai-sdk/openai
@ai-sdk/google
```

`@anthropic-ai/sdk` is removed from `dependencies` (it becomes a transitive dep via `@ai-sdk/anthropic`).

---

## Adding Future Providers

1. `npm install @ai-sdk/<provider>`
2. Add one entry to `src/providers/index.js`
3. Set `VITE_AI_PROVIDER=<provider>` and `VITE_<PROVIDER_UPPER>_API_KEY=...` in `.env`

No other files change.

---

## Out of Scope

- Multiple simultaneous providers / profile switching
- Backend proxy (all calls remain browser-direct)
- Model selector UI (model is fixed via `.env`)
- Streaming cancellation / abort

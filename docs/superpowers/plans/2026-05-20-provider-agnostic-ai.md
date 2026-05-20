# Provider-Agnostic AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hard-coded Anthropic SDK with the Vercel AI SDK so any provider (Anthropic, OpenAI, Google, …) can be selected via `.env` with zero code changes.

**Architecture:** A provider registry (`src/providers/index.js`) maps provider names to Vercel AI SDK factory functions. `src/hooks/useAI.js` replaces `useClaude.js` with the same two exported functions but reads provider/model/key from `import.meta.env`. `App.jsx` becomes simpler — no key management, no model selector.

**Tech Stack:** `ai` (Vercel AI SDK core), `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, React, Vite, Vitest.

---

## File Map

| File | Action |
|---|---|
| `src/providers/index.js` | **Create** — provider registry + `resolveConfig()` |
| `src/hooks/useAI.js` | **Create** — streaming AI functions (replaces `useClaude.js`) |
| `src/components/ConfigErrorPage.jsx` | **Create** — hard error page for missing `.env` vars |
| `src/tests/providers.test.js` | **Create** — tests for `resolveConfig` |
| `src/tests/useAI.test.js` | **Create** — tests for `normalizeUsage` |
| `src/App.jsx` | **Modify** — remove key/model UI, adapt imports |
| `.env` | **Modify** — add `VITE_AI_PROVIDER`, `VITE_AI_MODEL` |
| `.env.example` | **Modify** — update to reflect all vars |
| `src/hooks/useClaude.js` | **Delete** |
| `src/components/ApiKeyModal.jsx` | **Delete** |

---

## Task 1: Install Vercel AI SDK packages

**Files:** `package.json`

- [ ] **Step 1: Install new packages and remove the direct Anthropic SDK**

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google
npm uninstall @anthropic-ai/sdk
```

Expected output: no errors; `package.json` gains `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` and loses `@anthropic-ai/sdk`.

- [ ] **Step 2: Verify tests still pass (nothing broken yet)**

```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Vercel AI SDK, remove direct @anthropic-ai/sdk"
```

---

## Task 2: Create the provider registry

**Files:**
- Create: `src/providers/index.js`
- Create: `src/tests/providers.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/tests/providers.test.js`:

```js
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test -- providers
```

Expected: FAIL — `Cannot find module '../providers/index.js'`

- [ ] **Step 3: Create `src/providers/index.js`**

```js
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const PROVIDER_REGISTRY = {
  anthropic: {
    createProvider: (apiKey) => createAnthropic({ apiKey, dangerouslyAllowBrowser: true }),
    defaultModel: 'claude-sonnet-4-6',
    keyVar: 'VITE_ANTHROPIC_API_KEY',
  },
  openai: {
    createProvider: (apiKey) => createOpenAI({ apiKey, dangerouslyAllowBrowser: true }),
    defaultModel: 'gpt-4o',
    keyVar: 'VITE_OPENAI_API_KEY',
  },
  google: {
    createProvider: (apiKey) => createGoogleGenerativeAI({ apiKey }),
    defaultModel: 'gemini-2.0-flash',
    keyVar: 'VITE_GOOGLE_API_KEY',
  },
};

export function resolveConfig(env = import.meta.env) {
  const providerName = env.VITE_AI_PROVIDER;
  const entry = PROVIDER_REGISTRY[providerName];

  if (!providerName || !entry) {
    return {
      error: `VITE_AI_PROVIDER must be one of: ${Object.keys(PROVIDER_REGISTRY).join(', ')}. Got: "${providerName ?? ''}"`,
    };
  }

  const apiKey = env[entry.keyVar];
  if (!apiKey) {
    return { error: `${entry.keyVar} is required when VITE_AI_PROVIDER=${providerName}` };
  }

  return {
    provider: entry.createProvider(apiKey),
    model: env.VITE_AI_MODEL || entry.defaultModel,
    providerName,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- providers
```

Expected: all 7 provider tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/providers/index.js src/tests/providers.test.js
git commit -m "feat: add provider registry with resolveConfig"
```

---

## Task 3: Create `useAI.js`

**Files:**
- Create: `src/hooks/useAI.js`
- Create: `src/tests/useAI.test.js`

- [ ] **Step 1: Write the failing tests for `normalizeUsage`**

Create `src/tests/useAI.test.js`:

```js
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
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test -- useAI
```

Expected: FAIL — `Cannot find module '../hooks/useAI.js'`

- [ ] **Step 3: Create `src/hooks/useAI.js`**

```js
import { streamText } from 'ai';
import { resolveConfig } from '../providers/index.js';
import { parseRoadmapJson } from '../utils/parseRoadmap.js';

const ROADMAP_SYSTEM = `You are a curriculum designer creating structured learning roadmaps.

This roadmap must represent a realistic, actionable career or learning progression — from absolute beginner concepts to advanced mastery. Structure it the way an experienced practitioner would guide a newcomer, following the same philosophy as roadmap.sh.

Return ONLY a valid JSON object matching this exact schema. No markdown fences, no explanation, no text outside the JSON:

{
  "title": "string",
  "sections": [
    {
      "id": "s1",
      "label": "string",
      "color": "#e8f4fd",
      "nodes": [
        { "id": "n1", "label": "string (max 40 chars)", "level": "beginner" }
      ]
    }
  ],
  "edges": [{ "source": "n1", "target": "n2" }]
}

Node level values — use exactly one per node:
- "beginner"      — foundational concepts everyone must learn first
- "intermediate"  — builds on basics, required for serious real-world work
- "advanced"      — deep expertise for specialists or senior practitioners
- "optional"      — enrichment or broadening topics, not on the critical path

Rules:
- 5 to 8 sections representing major groupings (Prerequisites, Core Concepts, Tooling, Advanced Topics, Ecosystem, Best Practices)
- 2 to 6 nodes per section
- Every node must have a "level" field
- Edges define the learning order — prerequisites point to what they unlock
- Overall progression goes beginner → intermediate → advanced; optional topics enrich at any level
- Each section color must be a distinct soft pastel hex
- All ids must be unique strings across the entire roadmap`;

const EXPLANATION_SYSTEM = `You are a curriculum designer explaining concepts from learning roadmaps.

Write a thorough explanation covering:
1. What it is and why it matters in this roadmap's context
2. Key concepts and terminology
3. How to get started (concrete first steps)
4. Common pitfalls or misconceptions

Format your response in Markdown using headers, bold text, and bullet points where appropriate. Target length: 300–500 words. Be practical and concrete.`;

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

  const result = streamText({
    model: provider(model),
    system: ROADMAP_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Generate a learning roadmap for: "${topic}"\nModel the structure after how roadmap.sh organises "${topic}" — realistic and battle-tested.${contextLine}`,
      },
    ],
    maxTokens: 4096,
  });

  let raw = '';
  const EST_CHARS = 2200;

  for await (const chunk of result.textStream) {
    raw += chunk;
    onProgress?.(Math.min(raw.length, EST_CHARS), EST_CHARS);
  }

  const usage = await result.usage;
  const metadata = await result.experimental_providerMetadata;

  return { roadmap: parseRoadmapJson(raw), usage: normalizeUsage(usage, metadata) };
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
  });

  for await (const chunk of result.textStream) {
    onChunk(chunk);
  }

  const usage = await result.usage;
  const metadata = await result.experimental_providerMetadata;

  return { usage: normalizeUsage(usage, metadata) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- useAI
```

Expected: all 4 `normalizeUsage` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAI.js src/tests/useAI.test.js
git commit -m "feat: add useAI hook with Vercel AI SDK streaming"
```

---

## Task 4: Create `ConfigErrorPage`

**Files:**
- Create: `src/components/ConfigErrorPage.jsx`

There are no unit tests for this component — it is pure presentational markup with no logic.

- [ ] **Step 1: Create `src/components/ConfigErrorPage.jsx`**

```jsx
import { PROVIDER_REGISTRY } from '../providers/index.js';

export default function ConfigErrorPage({ error }) {
  const providers = Object.keys(PROVIDER_REGISTRY).join(' | ');
  return (
    <div className="config-error-page">
      <h1>Configuration Error</h1>
      <p className="config-error-page__message">{error}</p>
      <p>Add the missing variables to your <code>.env</code> file and restart the dev server:</p>
      <pre className="config-error-page__snippet">{`# Required
VITE_AI_PROVIDER=<${providers}>
VITE_ANTHROPIC_API_KEY=sk-ant-...   # when VITE_AI_PROVIDER=anthropic
VITE_OPENAI_API_KEY=sk-...          # when VITE_AI_PROVIDER=openai
VITE_GOOGLE_API_KEY=AI...           # when VITE_AI_PROVIDER=google

# Optional — defaults to the provider's recommended model
VITE_AI_MODEL=claude-sonnet-4-6`}</pre>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ConfigErrorPage.jsx
git commit -m "feat: add ConfigErrorPage for missing env config"
```

---

## Task 5: Update `App.jsx`

**Files:**
- Modify: `src/App.jsx`

This task removes key/model state management and wires up the new modules. Make each change below in sequence.

- [ ] **Step 1: Update imports at the top of `src/App.jsx`**

Replace:
```js
import ApiKeyModal from './components/ApiKeyModal.jsx';
import { generateRoadmap, explainNode, MODELS } from './hooks/useClaude.js';
```

With:
```js
import ConfigErrorPage from './components/ConfigErrorPage.jsx';
import { generateRoadmap, explainNode } from './hooks/useAI.js';
import { resolveConfig } from './providers/index.js';
```

- [ ] **Step 2: Remove the `STORAGE_KEY` constant and the `ModelSelector` component**

Delete this line near the top of the file:
```js
const STORAGE_KEY = 'roadmapz_api_key';
```

Delete the entire `ModelSelector` function (lines ~30–41 in the original):
```js
function ModelSelector({ value, onChange, disabled }) {
  const selected = MODELS.find(m => m.id === value);
  return (
    <div className="model-selector" title={selected?.description}>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
        {MODELS.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Replace state declarations at the top of the `App()` function**

Remove these three `useState` declarations:
```js
const [apiKey, setApiKey] = useState(() =>
  import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem(STORAGE_KEY) || ''
);
const [apiKeyError, setApiKeyError] = useState('');
const [model, setModel] = useState(MODELS[1].id);
```

Add this one line at the very top of `App()` (before any existing `useState`):
```js
const aiConfig = resolveConfig();
```

- [ ] **Step 4: Remove the `saveApiKey` function**

Delete:
```js
function saveApiKey(key) {
  localStorage.setItem(STORAGE_KEY, key);
  setApiKey(key);
  setApiKeyError('');
}
```

- [ ] **Step 5: Update `handleGenerate` — remove credential params**

Replace the `generateRoadmap` call inside `handleGenerate`:
```js
const { roadmap: result, usage } = await generateRoadmap(
  inputTopic, inputContext, apiKey,
  (chars, est) => setGenProgress(Math.min(95, Math.round((chars / est) * 100))),
  model
);
```

With:
```js
const { roadmap: result, usage } = await generateRoadmap(
  inputTopic, inputContext,
  (chars, est) => setGenProgress(Math.min(95, Math.round((chars / est) * 100))),
);
```

Also simplify the `catch` block — replace the auth-specific branch:
```js
if (err.message?.includes('401') || err.message?.includes('authentication')) {
  setApiKeyError('Invalid API key. Please check and re-enter it.');
  setApiKey('');
  localStorage.removeItem(STORAGE_KEY);
} else {
  pushError(err.message || 'Failed to generate roadmap.');
}
```

With:
```js
pushError(err.message || 'Failed to generate roadmap.');
```

- [ ] **Step 6: Update `fetchExplanation` — remove credential params**

Replace the `explainNode` call inside `fetchExplanation`:
```js
const { usage } = await explainNode(topic, nodeLabel, apiKey, (chunk) => {
  accumulated += chunk;
  setExplanations(prev => {
    const history = prev[nodeId] || [];
    const last = history[history.length - 1];
    if (last && last.streaming) {
      return { ...prev, [nodeId]: [...history.slice(0, -1), { ...last, content: accumulated }] };
    }
    return { ...prev, [nodeId]: [...history, { timestamp: new Date().toISOString(), content: accumulated, streaming: true }] };
  });
}, model);
```

With:
```js
const { usage } = await explainNode(topic, nodeLabel, (chunk) => {
  accumulated += chunk;
  setExplanations(prev => {
    const history = prev[nodeId] || [];
    const last = history[history.length - 1];
    if (last && last.streaming) {
      return { ...prev, [nodeId]: [...history.slice(0, -1), { ...last, content: accumulated }] };
    }
    return { ...prev, [nodeId]: [...history, { timestamp: new Date().toISOString(), content: accumulated, streaming: true }] };
  });
});
```

- [ ] **Step 7: Update `handleFileChange` — remove model restoration**

Inside the `reader.onload` callback, delete:
```js
if (data.model && MODELS.find(m => m.id === data.model)) setModel(data.model);
```

- [ ] **Step 8: Replace the conditional render and clean up the JSX**

Replace:
```js
if (!apiKey) {
  return <ApiKeyModal onSave={saveApiKey} error={apiKeyError} />;
}
```

With:
```js
if (aiConfig.error) {
  return <ConfigErrorPage error={aiConfig.error} />;
}
```

In the returned JSX, inside `<header className="app-header">`, remove:
```jsx
<ModelSelector value={model} onChange={setModel} disabled={isBusy} />
```

And remove the "API Key" change button block:
```jsx
{!import.meta.env.VITE_ANTHROPIC_API_KEY && (
  <button
    className="change-key-btn"
    onClick={() => { setApiKey(''); localStorage.removeItem(STORAGE_KEY); }}
  >
    API Key
  </button>
)}
```

- [ ] **Step 9: Run all tests**

```bash
npm test
```

Expected: all tests pass (including existing `parseRoadmap`, `prompts`, `layout`, `providers`, `useAI` suites).

- [ ] **Step 10: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire App.jsx to useAI and ConfigErrorPage, remove key/model UI"
```

---

## Task 6: Delete old files and update `.env`

**Files:**
- Delete: `src/hooks/useClaude.js`
- Delete: `src/components/ApiKeyModal.jsx`
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Delete the replaced files**

```bash
git rm src/hooks/useClaude.js src/components/ApiKeyModal.jsx
```

- [ ] **Step 2: Update `.env`**

Replace the entire contents of `.env` with:

```
VITE_AI_PROVIDER=anthropic
VITE_AI_MODEL=claude-sonnet-4-6
VITE_ANTHROPIC_API_KEY=<your existing key here>
```

(Keep your actual Anthropic key from the original file.)

- [ ] **Step 3: Update `.env.example`**

Replace the entire contents of `.env.example` with:

```
# Required: choose your AI provider
VITE_AI_PROVIDER=anthropic

# Optional: override the default model for the chosen provider
# VITE_AI_MODEL=claude-sonnet-4-6

# Provider API keys — only the one matching VITE_AI_PROVIDER is used
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...
VITE_GOOGLE_API_KEY=AI...
```

- [ ] **Step 4: Run all tests one final time**

```bash
npm test
```

Expected: all tests pass; no references to `useClaude` or `ApiKeyModal` remain.

- [ ] **Step 5: Commit**

```bash
git add .env.example .env
git commit -m "feat: update env files for multi-provider config"
git commit -m "chore: delete useClaude.js and ApiKeyModal.jsx"
```

Note: the `git rm` from Step 1 and the `.env` changes from Steps 2–3 can be combined into one commit:

```bash
git add -u
git add .env.example
git commit -m "chore: delete legacy files, update .env for provider-agnostic config"
```

---

## Task 7: Smoke test in the browser

**Files:** none

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: server starts, no console errors about missing modules.

- [ ] **Step 2: Verify happy path**

Open the app in a browser. Generate a roadmap for any topic (e.g., "Docker"). Confirm:
- Roadmap renders correctly
- Token badge appears with `↑` and `↓` counts
- Clicking a node and generating an explanation works
- Cache badge (`💾`) appears (Anthropic provider has cache metadata)

- [ ] **Step 3: Verify config error page**

Temporarily rename `.env` to `.env.bak`, restart the dev server, and open the app. Confirm the `ConfigErrorPage` renders with the missing var name in the error message.

Restore: rename `.env.bak` back to `.env`.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -u
git commit -m "fix: <describe any fixes>"
```

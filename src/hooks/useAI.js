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
    providerOptions: {
      anthropic: { cacheControl: { type: 'ephemeral' } },
    },
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

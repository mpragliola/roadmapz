import Anthropic from '@anthropic-ai/sdk';
import { parseRoadmapJson } from '../utils/parseRoadmap.js';

export const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku',  description: 'Fast & cheap — simple topics' },
  { id: 'claude-sonnet-4-6',         label: 'Sonnet', description: 'Balanced — recommended default' },
  { id: 'claude-opus-4-7',           label: 'Opus',   description: 'Best quality — complex/niche topics' },
];

const DEFAULT_MODEL = 'claude-sonnet-4-6';

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

// Both functions stream for responsive progress. onProgress(tokensSoFar, estimatedTotal) is optional.
export async function generateRoadmap(topic, context, apiKey, onProgress, model = DEFAULT_MODEL) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const contextLine = context ? `\n\nAdditional context from the user: ${context}` : '';
  const stream = client.messages.stream({
    model,
    max_tokens: 4096,
    system: [{ type: 'text', text: ROADMAP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Generate a learning roadmap for: "${topic}"\nModel the structure after how roadmap.sh organises "${topic}" — realistic and battle-tested.${contextLine}` }],
  });

  let raw = '';
  let usage = null;
  let outputTokens = 0;

  for await (const event of stream) {
    if (event.type === 'message_start') {
      usage = { ...event.message.usage };
    }
    if (event.type === 'message_delta' && event.usage) {
      outputTokens = event.usage.output_tokens;
      if (usage) usage.output_tokens = outputTokens;
      onProgress?.(outputTokens, 4096);
    }
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      raw += event.delta.text;
      onProgress?.(outputTokens, 4096);
    }
  }

  return { roadmap: parseRoadmapJson(raw), usage };
}

export async function explainNode(topic, nodeLabel, apiKey, onChunk, model = DEFAULT_MODEL) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const stream = client.messages.stream({
    model,
    max_tokens: 1024,
    system: [{ type: 'text', text: EXPLANATION_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Roadmap topic: "${topic}"\nConcept to explain: "${nodeLabel}"` }],
  });

  let usage = null;
  for await (const event of stream) {
    if (event.type === 'message_start') {
      usage = { ...event.message.usage };
    }
    if (event.type === 'message_delta' && event.usage) {
      if (usage) usage.output_tokens = event.usage.output_tokens;
    }
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
    }
  }
  return { usage };
}

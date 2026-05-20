import { streamText, Output } from 'ai';
import { resolveConfig } from '../providers/index.js';
import { roadmapSchema } from '../utils/roadmapSchema.js';

const EXPECTED_SECTIONS = 7; // midpoint of the "5 to 8 sections" system-prompt rule

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

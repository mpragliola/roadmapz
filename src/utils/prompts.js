export function buildRoadmapPrompt(topic) {
  return `You are a curriculum designer creating a structured learning roadmap.

Topic: "${topic}"

This roadmap must represent a realistic, actionable career or learning progression — from absolute beginner concepts to advanced mastery. Structure it the way an experienced practitioner would guide a newcomer through the full journey, following the same philosophy as roadmap.sh.

Return ONLY a valid JSON object. No markdown fences, no explanation, no text outside the JSON:

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
  "edges": [
    { "source": "n1", "target": "n2" }
  ]
}

Node level values — use exactly one of these strings per node:
- "beginner"      — foundational concepts everyone must learn first
- "intermediate"  — builds on basics, required for serious real-world work
- "advanced"      — deep expertise for specialists or senior practitioners
- "optional"      — enrichment or broadening topics, not on the critical path

Rules:
- 5 to 8 sections representing major groupings (e.g. Prerequisites, Core Concepts, Tooling, Advanced Topics, Ecosystem, Best Practices)
- 2 to 6 nodes per section
- Every node must have a "level" field with one of the four values above
- Edges define the learning order — prerequisites point to what they unlock
- The overall progression must go from beginner → intermediate → advanced
- Optional topics can appear at any level to indicate enrichment paths
- Each section color must be a distinct soft pastel hex (e.g. "#e8f4fd", "#fef9e7", "#f0fff4", "#fdf2f8")
- All ids must be unique strings across the entire roadmap
- Model the progression after how roadmap.sh structures "${topic}" — make it realistic and battle-tested`;
}

export function buildExplanationPrompt(topic, nodeLabel) {
  return `You are a curriculum designer explaining a concept from the "${topic}" learning roadmap.

Concept: **${nodeLabel}**

Write a thorough explanation covering:
1. What it is and why it matters in the context of ${topic}
2. Key concepts and terminology to know
3. How to get started (concrete first steps)
4. Common pitfalls or misconceptions

Format your response in Markdown using headers, bold text, and bullet points where appropriate. Target length: 300–500 words. Be practical and concrete.`;
}

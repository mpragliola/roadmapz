export function buildRoadmapPrompt(topic) {
  return `You are a technical education expert. Generate a structured learning roadmap for: "${topic}".

Return ONLY a valid JSON object matching this exact schema. No markdown fences, no explanation, no text outside the JSON:

{
  "title": "string",
  "sections": [
    {
      "id": "s1",
      "label": "string",
      "color": "#e8f4fd",
      "nodes": [
        { "id": "n1", "label": "string (max 40 chars)" }
      ]
    }
  ],
  "edges": [
    { "source": "n1", "target": "n2" }
  ]
}

Rules:
- 5 to 8 sections representing major topic groupings (prerequisites, core concepts, tooling, advanced, etc.)
- 2 to 6 nodes per section
- Edges define recommended top-down learning order across and within sections
- Each section color must be a distinct soft pastel hex (e.g. "#e8f4fd", "#fef9e7", "#f0fff4")
- All node and section ids must be unique strings across the entire roadmap
- Model the structure after how roadmap.sh organises the "${topic}" roadmap`;
}

export function buildExplanationPrompt(topic, nodeLabel) {
  return `You are a technical education expert helping someone learn "${topic}".

Explain the following concept thoroughly: **${nodeLabel}**

Cover:
1. What it is and why it matters in the context of ${topic}
2. Key concepts and terminology
3. How to get started learning it
4. Common pitfalls or misconceptions

Format your response in Markdown. Target length: 300–500 words. Be practical and concrete.`;
}

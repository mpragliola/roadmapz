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

export function parseRoadmapJson(raw) {
  const stripped = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new Error('Failed to parse roadmap JSON: ' + stripped.slice(0, 100));
  }

  if (!Array.isArray(parsed.sections) || !Array.isArray(parsed.edges)) {
    throw new Error('Invalid roadmap: missing sections or edges');
  }

  parsed.sections.forEach((section, i) => {
    section.color = SECTION_COLORS[i % SECTION_COLORS.length];
  });

  return parsed;
}

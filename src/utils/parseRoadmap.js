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

  return parsed;
}

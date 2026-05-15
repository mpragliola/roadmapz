import { parseRoadmapJson } from '../utils/parseRoadmap.js';

const VALID_JSON = {
  title: 'Frontend Development',
  sections: [
    {
      id: 's1',
      label: 'Internet',
      color: '#e8f4fd',
      nodes: [
        { id: 'n1', label: 'How the internet works' },
        { id: 'n2', label: 'HTTP' },
      ],
    },
  ],
  edges: [{ source: 'n1', target: 'n2' }],
};

describe('parseRoadmapJson', () => {
  it('parses a clean JSON string', () => {
    const result = parseRoadmapJson(JSON.stringify(VALID_JSON));
    expect(result.title).toBe('Frontend Development');
    expect(result.sections).toHaveLength(1);
    expect(result.edges).toHaveLength(1);
  });

  it('strips markdown code fences before parsing', () => {
    const wrapped = `\`\`\`json\n${JSON.stringify(VALID_JSON)}\n\`\`\``;
    const result = parseRoadmapJson(wrapped);
    expect(result.title).toBe('Frontend Development');
  });

  it('strips triple backtick fences without language tag', () => {
    const wrapped = `\`\`\`\n${JSON.stringify(VALID_JSON)}\n\`\`\``;
    const result = parseRoadmapJson(wrapped);
    expect(result.title).toBe('Frontend Development');
  });

  it('throws a descriptive error for invalid JSON', () => {
    expect(() => parseRoadmapJson('not json')).toThrow('Failed to parse roadmap JSON');
  });

  it('throws if sections is missing', () => {
    const bad = JSON.stringify({ title: 'X', edges: [] });
    expect(() => parseRoadmapJson(bad)).toThrow('Invalid roadmap: missing sections or edges');
  });

  it('throws if edges is missing', () => {
    const bad = JSON.stringify({ title: 'X', sections: [] });
    expect(() => parseRoadmapJson(bad)).toThrow('Invalid roadmap: missing sections or edges');
  });
});

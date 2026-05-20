import { roadmapSchema } from '../utils/roadmapSchema.js';

const VALID = {
  title: 'Frontend Development',
  sections: [
    {
      id: 's1',
      label: 'Basics',
      nodes: [
        { id: 'n1', label: 'HTML', level: 'beginner' },
        { id: 'n2', label: 'CSS', level: 'beginner' },
      ],
    },
  ],
  edges: [{ source: 'n1', target: 'n2' }],
};

describe('roadmapSchema', () => {
  it('accepts a valid roadmap', () => {
    expect(() => roadmapSchema.parse(VALID)).not.toThrow();
  });

  it('returns the parsed object with correct shape', () => {
    const result = roadmapSchema.parse(VALID);
    expect(result.title).toBe('Frontend Development');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].nodes[0].level).toBe('beginner');
  });

  it('rejects a node missing the level field', () => {
    const bad = structuredClone(VALID);
    delete bad.sections[0].nodes[0].level;
    expect(() => roadmapSchema.parse(bad)).toThrow();
  });

  it('rejects an invalid level value', () => {
    const bad = structuredClone(VALID);
    bad.sections[0].nodes[0].level = 'expert';
    expect(() => roadmapSchema.parse(bad)).toThrow();
  });

  it('rejects missing sections', () => {
    const { sections: _s, ...bad } = VALID;
    expect(() => roadmapSchema.parse(bad)).toThrow();
  });

  it('rejects missing edges', () => {
    const { edges: _e, ...bad } = VALID;
    expect(() => roadmapSchema.parse(bad)).toThrow();
  });
});

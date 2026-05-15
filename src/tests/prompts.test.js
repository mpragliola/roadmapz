import { buildRoadmapPrompt, buildExplanationPrompt } from '../utils/prompts.js';

describe('buildRoadmapPrompt', () => {
  it('includes the topic in the prompt', () => {
    const prompt = buildRoadmapPrompt('DevOps');
    expect(prompt).toContain('DevOps');
  });

  it('instructs Claude to return JSON only', () => {
    const prompt = buildRoadmapPrompt('DevOps');
    expect(prompt.toLowerCase()).toContain('json');
  });

  it('includes the required schema fields', () => {
    const prompt = buildRoadmapPrompt('DevOps');
    expect(prompt).toContain('"sections"');
    expect(prompt).toContain('"edges"');
    expect(prompt).toContain('"nodes"');
  });
});

describe('buildExplanationPrompt', () => {
  it('includes both topic and nodeLabel', () => {
    const prompt = buildExplanationPrompt('DevOps', 'Docker');
    expect(prompt).toContain('DevOps');
    expect(prompt).toContain('Docker');
  });

  it('requests markdown output', () => {
    const prompt = buildExplanationPrompt('DevOps', 'Docker');
    expect(prompt.toLowerCase()).toContain('markdown');
  });
});

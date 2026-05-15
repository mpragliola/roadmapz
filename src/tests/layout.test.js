import { computeLayout } from '../utils/layout.js';

const ROADMAP = {
  title: 'Test',
  sections: [
    {
      id: 's1',
      label: 'Basics',
      color: '#e8f4fd',
      nodes: [
        { id: 'n1', label: 'Node 1' },
        { id: 'n2', label: 'Node 2' },
      ],
    },
    {
      id: 's2',
      label: 'Advanced',
      color: '#fef9e7',
      nodes: [
        { id: 'n3', label: 'Node 3' },
      ],
    },
  ],
  edges: [
    { source: 'n1', target: 'n2' },
    { source: 'n2', target: 'n3' },
  ],
};

describe('computeLayout', () => {
  it('returns nodes and edges arrays', () => {
    const { nodes, edges } = computeLayout(ROADMAP);
    expect(Array.isArray(nodes)).toBe(true);
    expect(Array.isArray(edges)).toBe(true);
  });

  it('produces one section node per section', () => {
    const { nodes } = computeLayout(ROADMAP);
    const sectionNodes = nodes.filter(n => n.type === 'sectionNode');
    expect(sectionNodes).toHaveLength(2);
  });

  it('produces one topic node per topic', () => {
    const { nodes } = computeLayout(ROADMAP);
    const topicNodes = nodes.filter(n => n.type === 'topicNode');
    expect(topicNodes).toHaveLength(3);
  });

  it('topic nodes have absolute positions (no parentId) and use sourcePosition/targetPosition', () => {
    const { nodes } = computeLayout(ROADMAP);
    const n1 = nodes.find(n => n.id === 'n1');
    expect(n1.parentId).toBeUndefined();
    expect(n1.sourcePosition).toBe('bottom');
    expect(n1.targetPosition).toBe('top');
  });

  it('produces one edge per input edge', () => {
    const { edges } = computeLayout(ROADMAP);
    expect(edges).toHaveLength(2);
  });

  it('all topic nodes have numeric x and y positions', () => {
    const { nodes } = computeLayout(ROADMAP);
    nodes.filter(n => n.type === 'topicNode').forEach(n => {
      expect(typeof n.position.x).toBe('number');
      expect(typeof n.position.y).toBe('number');
    });
  });

  it('section nodes carry label and color in data', () => {
    const { nodes } = computeLayout(ROADMAP);
    const s1 = nodes.find(n => n.id === 's1');
    expect(s1.data.label).toBe('Basics');
    expect(s1.data.color).toBe('#e8f4fd');
  });
});

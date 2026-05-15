import dagre from '@dagrejs/dagre';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 44;
const SECTION_PADDING = 16;
const SECTION_LABEL_HEIGHT = 28;

export function computeLayout(roadmap) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 24, ranksep: 40, marginx: 30, marginy: 30 });

  roadmap.sections.forEach(section => {
    section.nodes.forEach(node => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });
  });

  roadmap.edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const rfNodes = [];
  const rfEdges = roadmap.edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    markerEnd: { type: 'arrowclosed' },
  }));

  roadmap.sections.forEach(section => {
    if (section.nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    section.nodes.forEach(node => {
      const pos = g.node(node.id);
      minX = Math.min(minX, pos.x - NODE_WIDTH / 2);
      minY = Math.min(minY, pos.y - NODE_HEIGHT / 2);
      maxX = Math.max(maxX, pos.x + NODE_WIDTH / 2);
      maxY = Math.max(maxY, pos.y + NODE_HEIGHT / 2);
    });

    const groupX = minX - SECTION_PADDING;
    const groupY = minY - SECTION_PADDING - SECTION_LABEL_HEIGHT;
    const groupWidth = maxX - minX + SECTION_PADDING * 2;
    const groupHeight = maxY - minY + SECTION_PADDING * 2 + SECTION_LABEL_HEIGHT;

    rfNodes.push({
      id: section.id,
      type: 'sectionNode',
      position: { x: groupX, y: groupY },
      style: { width: groupWidth, height: groupHeight },
      data: { label: section.label, color: section.color },
      draggable: false,
      selectable: false,
      zIndex: -1,
    });

    section.nodes.forEach(node => {
      const pos = g.node(node.id);
      rfNodes.push({
        id: node.id,
        type: 'topicNode',
        parentId: section.id,
        extent: 'parent',
        position: {
          x: pos.x - NODE_WIDTH / 2 - groupX,
          y: pos.y - NODE_HEIGHT / 2 - groupY,
        },
        data: { label: node.label },
        style: { width: NODE_WIDTH },
      });
    });
  });

  return { nodes: rfNodes, edges: rfEdges };
}

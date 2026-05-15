const NODE_WIDTH = 200;
const NODE_HEIGHT = 54;  // taller to fit label + level badge
const NODE_H_GAP = 14;
const NODE_V_GAP = 12;
const NODES_PER_ROW = 3;
const SECTION_H_PADDING = 18;
const SECTION_V_PADDING = 14;
const SECTION_LABEL_HEIGHT = 28;
const SECTION_GAP = 48;

export function computeLayout(roadmap) {
  let currentY = 0;
  const rfNodes = [];

  const rfEdges = roadmap.edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    markerEnd: { type: 'arrowclosed' },
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  }));

  roadmap.sections.forEach(section => {
    if (section.nodes.length === 0) return;

    const cols = Math.min(section.nodes.length, NODES_PER_ROW);
    const rows = Math.ceil(section.nodes.length / NODES_PER_ROW);

    const groupWidth =
      cols * NODE_WIDTH + (cols - 1) * NODE_H_GAP + SECTION_H_PADDING * 2;
    const groupHeight =
      SECTION_LABEL_HEIGHT +
      SECTION_V_PADDING +
      rows * NODE_HEIGHT +
      (rows - 1) * NODE_V_GAP +
      SECTION_V_PADDING;

    // Section box — plain background node, no parent relationship
    rfNodes.push({
      id: section.id,
      type: 'sectionNode',
      position: { x: 0, y: currentY },
      style: { width: groupWidth, height: groupHeight, pointerEvents: 'none' },
      data: { label: section.label, color: section.color },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: 0,
    });

    // Topic nodes use absolute positions — no parentId, no extent
    section.nodes.forEach((node, idx) => {
      const row = Math.floor(idx / NODES_PER_ROW);
      const col = idx % NODES_PER_ROW;
      rfNodes.push({
        id: node.id,
        type: 'topicNode',
        // absolute coordinates — avoids React Flow parent/child sizing bugs
        position: {
          x: SECTION_H_PADDING + col * (NODE_WIDTH + NODE_H_GAP),
          y: currentY + SECTION_LABEL_HEIGHT + SECTION_V_PADDING + row * (NODE_HEIGHT + NODE_V_GAP),
        },
        // tell React Flow where edges should attach (no Handle components needed)
        sourcePosition: 'bottom',
        targetPosition: 'top',
        data: { label: node.label, level: node.level || 'beginner' },
        style: { width: NODE_WIDTH },
        zIndex: 1,
      });
    });

    currentY += groupHeight + SECTION_GAP;
  });

  return { nodes: rfNodes, edges: rfEdges };
}

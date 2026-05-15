// Spine layout: section banners are centered "spine markers", topic rows branch below them.
// All coordinates center around x=0; fitView in React Flow will centre the canvas.

const BANNER_WIDTH = 680;
const BANNER_HEIGHT = 42;
const NODE_WIDTH = 190;
const NODE_HEIGHT = 54;
const NODE_H_GAP = 16;
const NODE_V_GAP = 12;
const NODES_PER_ROW = 3;
const BANNER_TO_NODES_GAP = 18;
const NODES_TO_NEXT_BANNER_GAP = 48;

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

    // Section banner — centred at x=0
    rfNodes.push({
      id: section.id,
      type: 'sectionNode',
      position: { x: -(BANNER_WIDTH / 2), y: currentY },
      style: { width: BANNER_WIDTH, height: BANNER_HEIGHT, pointerEvents: 'none' },
      data: { label: section.label, color: section.color },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: 0,
    });

    currentY += BANNER_HEIGHT + BANNER_TO_NODES_GAP;

    // Topic rows — each row centred at x=0
    const totalRows = Math.ceil(section.nodes.length / NODES_PER_ROW);
    section.nodes.forEach((node, idx) => {
      const rowIdx = Math.floor(idx / NODES_PER_ROW);
      const colIdx = idx % NODES_PER_ROW;
      const nodesInRow = Math.min(NODES_PER_ROW, section.nodes.length - rowIdx * NODES_PER_ROW);
      const rowWidth = nodesInRow * NODE_WIDTH + (nodesInRow - 1) * NODE_H_GAP;

      rfNodes.push({
        id: node.id,
        type: 'topicNode',
        position: {
          x: -(rowWidth / 2) + colIdx * (NODE_WIDTH + NODE_H_GAP),
          y: currentY + rowIdx * (NODE_HEIGHT + NODE_V_GAP),
        },
        sourcePosition: 'bottom',
        targetPosition: 'top',
        data: { label: node.label, level: node.level || 'beginner' },
        style: { width: NODE_WIDTH },
        zIndex: 1,
      });
    });

    currentY += totalRows * NODE_HEIGHT + (totalRows - 1) * NODE_V_GAP + NODES_TO_NEXT_BANNER_GAP;
  });

  return { nodes: rfNodes, edges: rfEdges };
}

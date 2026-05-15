import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import SectionNode from './SectionNode.jsx';
import TopicNode from './TopicNode.jsx';
import { computeLayout } from '../utils/layout.js';

const nodeTypes = {
  sectionNode: SectionNode,
  topicNode: TopicNode,
};

export default function RoadmapCanvas({ roadmap, onNodeClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!roadmap) { setNodes([]); setEdges([]); return; }
    const { nodes: n, edges: e } = computeLayout(roadmap);
    setNodes(n);
    setEdges(e);
  }, [roadmap]);

  const handleNodeClick = useCallback(
    (event, node) => {
      if (node.type === 'topicNode') onNodeClick(node);
    },
    [onNodeClick]
  );

  if (!roadmap) {
    return (
      <div className="canvas-empty">
        <p>Enter a topic above and click Generate to build your roadmap.</p>
      </div>
    );
  }

  return (
    <div className="canvas-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  );
}

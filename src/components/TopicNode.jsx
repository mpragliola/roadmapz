import { Handle, Position } from '@xyflow/react';

export default function TopicNode({ data, selected }) {
  return (
    <div
      style={{
        background: '#fff',
        border: selected ? '2px solid #3b82f6' : '1.5px solid #d0d7de',
        borderRadius: 6,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 500,
        color: '#1a1a1a',
        cursor: 'pointer',
        boxShadow: selected
          ? '0 0 0 3px rgba(59,130,246,0.15)'
          : '0 1px 3px rgba(0,0,0,0.08)',
        userSelect: 'none',
        minWidth: 120,
        textAlign: 'center',
        boxSizing: 'border-box',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

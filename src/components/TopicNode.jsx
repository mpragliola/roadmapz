import { Handle, Position } from '@xyflow/react';

const LEVEL_STYLES = {
  beginner:     { bg: '#f0fdf4', border: '#86efac', text: '#15803d', badge: '#dcfce7', badgeText: '#166534' },
  intermediate: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', badge: '#dbeafe', badgeText: '#1e40af' },
  advanced:     { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', badge: '#ffedd5', badgeText: '#9a3412' },
  optional:     { bg: '#faf5ff', border: '#d8b4fe', text: '#7e22ce', badge: '#f3e8ff', badgeText: '#6b21a8' },
};

export default function TopicNode({ data, selected }) {
  const style = LEVEL_STYLES[data.level] || LEVEL_STYLES.beginner;

  return (
    <div
      style={{
        background: style.bg,
        border: selected ? `2px solid #3b82f6` : `1.5px solid ${style.border}`,
        borderRadius: 6,
        padding: '6px 12px 6px',
        fontSize: 12,
        fontWeight: 500,
        color: style.text,
        cursor: 'pointer',
        boxShadow: selected
          ? '0 0 0 3px rgba(59,130,246,0.2)'
          : '0 1px 2px rgba(0,0,0,0.06)',
        userSelect: 'none',
        textAlign: 'center',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <span style={{ lineHeight: 1.3 }}>{data.label}</span>
      <span style={{
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: style.badge,
        color: style.badgeText,
        borderRadius: 3,
        padding: '1px 5px',
      }}>
        {data.level || 'beginner'}
      </span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

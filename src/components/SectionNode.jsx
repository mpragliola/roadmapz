export default function SectionNode({ data, style }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: data.color || '#f0f4ff',
        border: '1.5px solid #d0d7de',
        borderRadius: 10,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 12,
          color: '#444',
          padding: '6px 10px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {data.label}
      </div>
    </div>
  );
}

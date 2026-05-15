export default function SectionNode({ data }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: data.color || '#f0f4ff',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        pointerEvents: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
      }}
    >
      <span style={{
        width: 3,
        height: 20,
        borderRadius: 2,
        background: 'rgba(0,0,0,0.18)',
        flexShrink: 0,
      }} />
      <span style={{
        fontWeight: 800,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: '#334155',
      }}>
        {data.label}
      </span>
    </div>
  );
}

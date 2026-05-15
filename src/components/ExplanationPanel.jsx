import { useState, useEffect } from 'react';

function renderMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

export default function ExplanationPanel({ nodeLabel, history, loading, onRegenerate, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(history.length - 1);

  useEffect(() => {
    setSelectedIndex(history.length - 1);
  }, [history.length, nodeLabel]);

  if (!nodeLabel) return null;

  const current = history[selectedIndex];

  return (
    <div className="explanation-panel">
      <div className="explanation-header">
        <h2>{nodeLabel}</h2>
        <button aria-label="Close" onClick={onClose} className="close-btn">✕</button>
      </div>

      {history.length > 1 && (
        <select
          value={selectedIndex}
          onChange={e => setSelectedIndex(Number(e.target.value))}
          className="history-select"
        >
          {history.map((entry, i) => (
            <option key={i} value={i}>
              {i === history.length - 1 ? 'Latest' : `History ${i + 1}`} — {new Date(entry.timestamp).toLocaleTimeString()}
            </option>
          ))}
        </select>
      )}

      <div
        className="explanation-content"
        dangerouslySetInnerHTML={{ __html: current ? renderMarkdown(current.content) : '' }}
      />

      <button
        className="regenerate-btn"
        onClick={onRegenerate}
        disabled={loading}
        aria-label={loading ? 'Loading' : 'Regenerate'}
      >
        {loading ? 'Loading...' : '↺ Regenerate'}
      </button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { marked } from 'marked';

marked.use({ gfm: true, breaks: true });

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

      {loading && !current && (
        <div className="explanation-skeleton">
          <div className="skeleton-line skeleton-line--wide" />
          <div className="skeleton-line skeleton-line--medium" />
          <div className="skeleton-line skeleton-line--wide" />
          <div className="skeleton-line skeleton-line--short" />
          <div className="skeleton-line skeleton-line--wide" />
          <div className="skeleton-line skeleton-line--medium" />
        </div>
      )}

      {current && (
        <div
          className="explanation-content"
          dangerouslySetInnerHTML={{ __html: marked.parse(current.content) }}
        />
      )}

      <button
        className="regenerate-btn"
        onClick={onRegenerate}
        disabled={loading}
        aria-label={loading ? 'Loading' : 'Regenerate'}
      >
        {loading ? (
          <span className="btn-spinner-row"><span className="spinner-sm" /> Generating...</span>
        ) : (
          '↺ Regenerate'
        )}
      </button>
    </div>
  );
}

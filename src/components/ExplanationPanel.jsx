import { useState, useEffect } from 'react';
import { marked } from 'marked';

marked.use({ gfm: true, breaks: true });

export default function ExplanationPanel({ nodeLabel, nodeLevel, history, loading, onGenerate, onRegenerate, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(history.length - 1);

  useEffect(() => {
    setSelectedIndex(history.length - 1);
  }, [history.length, nodeLabel]);

  if (!nodeLabel) return null;

  const hasContent = history.length > 0;
  const current = hasContent ? history[selectedIndex] : null;

  const LEVEL_LABELS = {
    beginner: { label: 'Beginner', color: '#166534', bg: '#dcfce7' },
    intermediate: { label: 'Intermediate', color: '#1e40af', bg: '#dbeafe' },
    advanced: { label: 'Advanced', color: '#9a3412', bg: '#ffedd5' },
    optional: { label: 'Optional', color: '#6b21a8', bg: '#f3e8ff' },
  };
  const levelStyle = LEVEL_LABELS[nodeLevel] || LEVEL_LABELS.beginner;

  return (
    <div className="explanation-panel">
      <div className="explanation-header">
        <div className="explanation-title">
          <h2>{nodeLabel}</h2>
          <span className="level-pill" style={{ background: levelStyle.bg, color: levelStyle.color }}>
            {levelStyle.label}
          </span>
        </div>
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

      {!hasContent && !loading && (
        <div className="explanation-empty">
          <p>No explanation generated yet.</p>
          <button className="generate-first-btn" onClick={onGenerate}>
            Generate Explanation
          </button>
        </div>
      )}

      {current && (
        <div
          className="explanation-content"
          dangerouslySetInnerHTML={{ __html: marked.parse(current.content) }}
        />
      )}

      {hasContent && (
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
      )}
    </div>
  );
}

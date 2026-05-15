import { useState } from 'react';

export default function TopicInput({ onGenerate, loading }) {
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (topic.trim()) onGenerate(topic.trim(), context.trim() || null);
  }

  return (
    <div className="topic-input-wrapper">
      <form className="topic-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="e.g. Frontend Development, DevOps, Machine Learning..."
          value={topic}
          onChange={e => setTopic(e.target.value)}
          disabled={loading}
        />
        <button
          type="button"
          className="context-toggle-btn"
          onClick={() => setShowContext(v => !v)}
          title="Add context"
          disabled={loading}
        >
          {showContext ? '▲' : '+ context'}
        </button>
        <button type="submit" disabled={loading || !topic.trim()}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      {showContext && (
        <textarea
          className="context-textarea"
          placeholder="Optional: add context to guide the roadmap (e.g. 'I'm a backend developer targeting a senior role', 'focus on cloud-native tools', 'I already know Python basics')"
          value={context}
          onChange={e => setContext(e.target.value)}
          disabled={loading}
          rows={3}
        />
      )}
    </div>
  );
}

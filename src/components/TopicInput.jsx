import { useState } from 'react';

export default function TopicInput({ onGenerate, loading }) {
  const [topic, setTopic] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (topic.trim()) onGenerate(topic.trim());
  }

  return (
    <form className="topic-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="e.g. Frontend Development, DevOps, Machine Learning..."
        value={topic}
        onChange={e => setTopic(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </form>
  );
}

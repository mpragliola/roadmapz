import { useState } from 'react';

export default function ApiKeyModal({ onSave, error }) {
  const [value, setValue] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim()) onSave(value.trim());
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Enter your Anthropic API Key</h2>
        <p>Your key is stored only in your browser's localStorage.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
          />
          {error && <p className="modal-error">{error}</p>}
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  );
}

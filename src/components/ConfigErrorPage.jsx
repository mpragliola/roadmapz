import { PROVIDER_REGISTRY } from '../providers/index.js';

export default function ConfigErrorPage({ error }) {
  const providers = Object.keys(PROVIDER_REGISTRY).join(' | ');
  return (
    <div className="config-error-page">
      <h1>Configuration Error</h1>
      <p className="config-error-page__message">{error}</p>
      <p>Add the missing variables to your <code>.env</code> file and restart the dev server:</p>
      <pre className="config-error-page__snippet">{`# Required
AI_PROVIDER=<${providers}>
ANTHROPIC_API_KEY=sk-ant-...   # when AI_PROVIDER=anthropic
OPENAI_API_KEY=sk-...          # when AI_PROVIDER=openai
GOOGLE_API_KEY=AI...           # when AI_PROVIDER=google

# Optional — defaults to the provider's recommended model
AI_MODEL=claude-sonnet-4-6`}</pre>
    </div>
  );
}

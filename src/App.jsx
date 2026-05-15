import { useState, useRef } from 'react';
import { marked } from 'marked';
import ApiKeyModal from './components/ApiKeyModal.jsx';
import TopicInput from './components/TopicInput.jsx';
import RoadmapCanvas from './components/RoadmapCanvas.jsx';
import ExplanationPanel from './components/ExplanationPanel.jsx';
import { generateRoadmap, explainNode, MODELS } from './hooks/useClaude.js';

const STORAGE_KEY = 'roadmapz_api_key';
const SAVE_VERSION = 1;

function TokenBadge({ stats }) {
  if (!stats.totalIn && !stats.totalOut) return null;
  const cacheHitPct = stats.totalIn > 0
    ? Math.round((stats.cacheRead / stats.totalIn) * 100)
    : 0;
  return (
    <div className="token-badge" title={`Input: ${stats.totalIn} | Output: ${stats.totalOut} | Cache reads: ${stats.cacheRead} | Cache writes: ${stats.cacheWrite}`}>
      <span className="token-badge__item">↑{stats.totalIn.toLocaleString()}</span>
      <span className="token-badge__item">↓{stats.totalOut.toLocaleString()}</span>
      {stats.cacheRead > 0 && (
        <span className="token-badge__item token-badge__cache" title="Tokens served from cache (90% cheaper)">
          💾{cacheHitPct}%
        </span>
      )}
    </div>
  );
}

function ModelSelector({ value, onChange, disabled }) {
  const selected = MODELS.find(m => m.id === value);
  return (
    <div className="model-selector" title={selected?.description}>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
        {MODELS.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(() =>
    import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem(STORAGE_KEY) || ''
  );
  const [apiKeyError, setApiKeyError] = useState('');

  const [topic, setTopic] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [genProgress, setGenProgress] = useState(0);

  const [errors, setErrors] = useState([]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const [tokenStats, setTokenStats] = useState({ totalIn: 0, totalOut: 0, cacheRead: 0, cacheWrite: 0 });
  const [model, setModel] = useState(MODELS[1].id);

  const loadFileRef = useRef(null);

  function addTokens(usage) {
    if (!usage) return;
    setTokenStats(prev => ({
      totalIn:    prev.totalIn    + (usage.input_tokens  || 0),
      totalOut:   prev.totalOut   + (usage.output_tokens || 0),
      cacheRead:  prev.cacheRead  + (usage.cache_read_input_tokens    || 0),
      cacheWrite: prev.cacheWrite + (usage.cache_creation_input_tokens || 0),
    }));
  }

  function pushError(msg) {
    const id = Date.now();
    setErrors(prev => [...prev, { id, msg }]);
    setTimeout(() => setErrors(prev => prev.filter(e => e.id !== id)), 6000);
  }

  function saveApiKey(key) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    setApiKeyError('');
  }

  // ── Generation ─────────────────────────────────────────────────────────────

  async function handleGenerate(inputTopic, inputContext) {
    setTopic(inputTopic);
    setSelectedNode(null);
    setExplanations({});
    setLoadingRoadmap(true);
    setLoadingStatus('Generating roadmap…');
    setGenProgress(0);
    try {
      const { roadmap: result, usage } = await generateRoadmap(
        inputTopic, inputContext, apiKey,
        (chars, est) => setGenProgress(Math.min(95, Math.round((chars / est) * 100))),
        model
      );
      setRoadmap(result);
      addTokens(usage);
      setGenProgress(100);
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('authentication')) {
        setApiKeyError('Invalid API key. Please check and re-enter it.');
        setApiKey('');
        localStorage.removeItem(STORAGE_KEY);
      } else {
        pushError(err.message || 'Failed to generate roadmap.');
      }
    } finally {
      setLoadingRoadmap(false);
      setLoadingStatus('');
      setTimeout(() => setGenProgress(0), 600);
    }
  }

  // ── Node click — NO auto-generation; user must click "Generate" in panel ───

  function handleNodeClick(node) {
    setSelectedNode(node);
  }

  async function handleGenerateExplanation() {
    if (!selectedNode) return;
    await fetchExplanation(selectedNode.id, selectedNode.data.label);
  }

  async function fetchExplanation(nodeId, nodeLabel) {
    setLoadingExplanation(true);
    setLoadingStatus(`Generating: ${nodeLabel}…`);
    let accumulated = '';
    try {
      const { usage } = await explainNode(topic, nodeLabel, apiKey, (chunk) => {
        accumulated += chunk;
        setExplanations(prev => {
          const history = prev[nodeId] || [];
          const last = history[history.length - 1];
          if (last && last.streaming) {
            return { ...prev, [nodeId]: [...history.slice(0, -1), { ...last, content: accumulated }] };
          }
          return { ...prev, [nodeId]: [...history, { timestamp: new Date().toISOString(), content: accumulated, streaming: true }] };
        });
      }, model);
      setExplanations(prev => {
        const history = prev[nodeId] || [];
        return { ...prev, [nodeId]: history.map((e, i) => i === history.length - 1 ? { ...e, streaming: false } : e) };
      });
      addTokens(usage);
    } catch (err) {
      pushError(err.message || 'Failed to fetch explanation.');
    } finally {
      setLoadingExplanation(false);
      setLoadingStatus('');
    }
  }

  async function handleRegenerate() {
    if (!selectedNode) return;
    await fetchExplanation(selectedNode.id, selectedNode.data.label);
  }

  // ── Save / Load ─────────────────────────────────────────────────────────────

  function handleSave() {
    if (!roadmap) return;
    const data = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      topic,
      model,
      roadmap,
      explanations,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadmap-${topic.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLoadClick() {
    loadFileRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setTopic(data.topic || '');
        setRoadmap(data.roadmap);
        setExplanations(data.explanations || {});
        setSelectedNode(null);
        if (data.model && MODELS.find(m => m.id === data.model)) setModel(data.model);
      } catch {
        pushError('Failed to load file — invalid format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── PDF / Print ─────────────────────────────────────────────────────────────

  function handlePrint() {
    window.print();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const selectedHistory = selectedNode ? (explanations[selectedNode.id] || []) : [];
  const isBusy = loadingRoadmap || loadingExplanation;

  if (!apiKey) {
    return <ApiKeyModal onSave={saveApiKey} error={apiKeyError} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">roadmapz</span>
        <TopicInput onGenerate={handleGenerate} loading={loadingRoadmap} />
        <ModelSelector value={model} onChange={setModel} disabled={isBusy} />
        <TokenBadge stats={tokenStats} />
        <div className="header-actions">
          <button className="action-btn" onClick={handleSave} disabled={!roadmap} title="Save roadmap">
            💾
          </button>
          <button className="action-btn" onClick={handleLoadClick} title="Load roadmap">
            📂
          </button>
          <button className="action-btn" onClick={handlePrint} disabled={!roadmap} title="Export to PDF">
            🖨
          </button>
          <input ref={loadFileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
        {!import.meta.env.VITE_ANTHROPIC_API_KEY && (
          <button
            className="change-key-btn"
            onClick={() => { setApiKey(''); localStorage.removeItem(STORAGE_KEY); }}
          >
            API Key
          </button>
        )}
      </header>

      {isBusy && (
        <div className="progress-bar-track">
          <div
            className={genProgress > 0 ? 'progress-bar-fill progress-bar-fill--real' : 'progress-bar-fill'}
            style={genProgress > 0 ? { width: `${genProgress}%` } : undefined}
          />
          {loadingStatus && <span className="progress-label">{loadingStatus}</span>}
        </div>
      )}

      <div className="app-body">
        <RoadmapCanvas roadmap={roadmap} onNodeClick={handleNodeClick} />
        <ExplanationPanel
          nodeLabel={selectedNode?.data?.label || null}
          nodeLevel={selectedNode?.data?.level || 'beginner'}
          history={selectedHistory}
          loading={loadingExplanation}
          onGenerate={handleGenerateExplanation}
          onRegenerate={handleRegenerate}
          onClose={() => setSelectedNode(null)}
        />
      </div>

      {/* Print view — hidden in browser, shown by @media print */}
      {roadmap && (
        <PrintView topic={topic} roadmap={roadmap} explanations={explanations} />
      )}

      <div className="toast-stack">
        {errors.map(e => (
          <div key={e.id} className="toast toast--error">
            <span>⚠ {e.msg}</span>
            <button onClick={() => setErrors(prev => prev.filter(x => x.id !== e.id))}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrintView({ topic, roadmap, explanations }) {
  return (
    <div className="print-view">
      <h1>{roadmap.title || topic}</h1>
      <p className="print-meta">Generated with roadmapz · {new Date().toLocaleDateString()}</p>

      {roadmap.sections.map(section => (
        <div key={section.id} className="print-section">
          <h2>{section.label}</h2>
          {section.nodes.map(node => {
            const history = explanations[node.id] || [];
            const latest = history[history.length - 1];
            return (
              <div key={node.id} className="print-node">
                <h3>
                  {node.label}
                  <span className="print-level"> [{node.level}]</span>
                </h3>
                {latest
                  ? <div className="print-explanation" dangerouslySetInnerHTML={{ __html: marked.parse(latest.content) }} />
                  : <p className="print-no-explanation"><em>No explanation generated.</em></p>
                }
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

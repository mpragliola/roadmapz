# Roadmapz — Design Spec

**Date:** 2026-05-15  
**Status:** Approved

---

## Overview

A browser-based local app that generates interactive learning roadmaps in the style of roadmap.sh. The user enters a topic, Claude generates a structured roadmap diagram, and clicking any node shows an AI-generated explanation. Explanations can be regenerated with full history retained.

---

## Tech Stack

- **Framework:** React (Vite)
- **Diagram library:** React Flow (xyflow)
- **AI provider:** Claude (Anthropic API, called directly from the browser)
- **Deployment:** Local only — `npm run dev`, no backend

---

## Architecture

Single-page React app. No server. On first load, a modal prompts the user for their Anthropic API key, which is persisted in `localStorage`. All Claude API calls originate from the browser.

Two top-level panels:
1. **RoadmapCanvas** — full-height React Flow diagram, pannable and zoomable
2. **ExplanationPanel** — collapsible side panel, opens when a node is clicked

Global state lives in `App.jsx`: roadmap data, selected node ID, explanation history map.

---

## Data Model

### Roadmap JSON (Claude output for generation)

```json
{
  "title": "Frontend Development",
  "sections": [
    {
      "id": "s1",
      "label": "Internet",
      "color": "#e8f4f8",
      "nodes": [
        { "id": "n1", "label": "How does the internet work?" },
        { "id": "n2", "label": "What is HTTP?" }
      ]
    }
  ],
  "edges": [
    { "source": "n1", "target": "n2" }
  ]
}
```

- Sections map to React Flow group nodes with a colored background and label
- Topic nodes are children of their section group node
- Edges connect topic nodes across and within sections

### Explanation History (React state)

```ts
type ExplanationHistory = {
  [nodeId: string]: Array<{
    timestamp: string   // ISO 8601
    content: string     // markdown
  }>
}
```

The latest entry is shown by default. A "History" dropdown lets the user view previous generations. Each regeneration appends to the array.

---

## Claude API Calls

### 1. Roadmap Generation

**Trigger:** User submits a topic via TopicInput.

**Prompt strategy (`prompts.js`):**
- System prompt instructs Claude to return valid JSON matching the schema above, with no prose outside the JSON block
- Sections should reflect the major groupings roadmap.sh uses (prerequisites, core concepts, tools, advanced topics, etc.)
- Typically 5–10 sections, 2–6 nodes per section
- Edges define a top-down learning order

**Implementation:** `useClaude.js` → `generateRoadmap(topic, apiKey)` — non-streaming, parses JSON from response.

### 2. Node Explanation

**Trigger:** User clicks a topic node (or clicks "Regenerate" in the side panel).

**Prompt strategy:**
- System prompt provides the overall roadmap topic and the node label
- Asks for a thorough explanation: what it is, why it matters in this context, key concepts, and how to learn it
- Returns markdown

**Implementation:** `useClaude.js` → `explainNode(topic, nodeLabel, apiKey)` — streaming, content appended to ExplanationPanel as it arrives.

---

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  roadmapz          [topic input field]  [Generate]  │
├─────────────────────────────────┬───────────────────┤
│                                 │  Node Title       │
│                                 │  ─────────────    │
│   React Flow Canvas             │  [explanation]    │
│   (full height, pannable/       │                   │
│    zoomable)                    │  [Regenerate]     │
│                                 │  History ▾        │
│                                 │                   │
└─────────────────────────────────┴───────────────────┘
```

- Side panel slides in when a node is clicked; closes when clicking the canvas background
- Canvas takes full remaining height, side panel is fixed width (~380px)

---

## Visual Style (roadmap.sh match)

- **Topic nodes:** white rounded rectangles, subtle gray border, small padding, dark text
- **Section groups:** light-colored background box with a bold section label at top-left
- **Edges:** straight arrows, top-to-bottom flow, dark gray
- **Selected node:** highlighted border (blue accent)
- **Font:** clean sans-serif (Inter or system font)
- **Background:** light gray canvas grid (React Flow default)

---

## Layout Computation

React Flow requires explicit `x`/`y` positions for every node. Claude's JSON does not include positions. After parsing the roadmap JSON, `RoadmapCanvas.jsx` runs **dagre** (via `@dagrejs/dagre`) to compute a top-down hierarchical layout automatically. Section group nodes are sized to wrap their children. This happens client-side before the diagram is rendered.

---

## Component Structure

```
src/
├── App.jsx
├── components/
│   ├── ApiKeyModal.jsx       # first-run API key prompt, saves to localStorage
│   ├── TopicInput.jsx        # topic field + Generate button + loading state
│   ├── RoadmapCanvas.jsx     # React Flow wrapper; maps roadmap JSON to nodes/edges
│   ├── SectionNode.jsx       # custom React Flow group node (section container)
│   ├── TopicNode.jsx         # custom React Flow node (individual topic)
│   └── ExplanationPanel.jsx  # side panel: markdown explanation, Regenerate, History
├── hooks/
│   └── useClaude.js          # generateRoadmap(), explainNode() — handles API calls
└── utils/
    └── prompts.js            # system prompt strings for generation and explanation
```

---

## State Shape (App.jsx)

```ts
type AppState = {
  apiKey: string                        // from localStorage
  topic: string                         // current topic string
  roadmap: RoadmapJSON | null           // parsed Claude output
  selectedNodeId: string | null         // currently selected topic node
  explanations: ExplanationHistory      // all explanation history by node ID
  loading: {
    roadmap: boolean
    explanation: boolean
  }
  error: string | null
}
```

---

## Error Handling

- Invalid/missing API key: caught on first call, re-shows ApiKeyModal with error message
- Claude API error (rate limit, network): shown as an inline error banner, dismissible
- Malformed JSON from Claude: retry prompt with stricter instructions, show error if retry fails

---

## Out of Scope

- Progress tracking (marking nodes done/in-progress)
- Saving or exporting roadmaps
- Manual diagram editing (adding/removing/moving nodes)
- User accounts or persistence beyond localStorage for the API key
- Mobile layout

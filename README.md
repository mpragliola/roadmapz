# roadmapZ

A fun little toy that uses Claude to generate interactive learning roadmaps on any topic — inspired by [roadmap.sh](https://roadmap.sh).

Type a subject, pick a model, and get a visual node-based roadmap with explanations for each topic. That's it.

### Features 

- LLM-generated roadmap and topic explanations
- can cache explanation and keep history of generations

## Stack

- React + Vite
- React Flow (canvas)
- Anthropic SDK (streamed responses)

## Run it

```bash
npm install
npm run dev
```

You'll need an Anthropic API key. Set `VITE_ANTHROPIC_API_KEY` in a `.env` file or enter it in the UI.

---

*Built for fun while playing with Claude Code and the Claude API.*

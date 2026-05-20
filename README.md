# roadmapZ

A fun little toy that leverages LLMs to generate interactive learning roadmaps on any topic.
Inspired by [roadmap.sh](https://roadmap.sh).

Type a learning subject, pick a model, and get a visual node-based roadmap with explanations 
for each topic and prioritization.

### Features 

- LLM-generated roadmap and topic explanations
- can cache explanation and keep history of generations

## Stack

- React + Vite
- React Flow (canvas)

### Usage of LLMs

- It was initially built for **Anthropic (Claude)**, but now abstracts the LLMs via **Vercel**,
  broadening the choice to **OpenAI (ChatGPT)**, **Google (Gemini)**
- Model choice possible
- Makes use of **system/user prompts**, **structured output** features (JSON) via **Zod** schema
- Keeps track of input/output/cached token usage

## Run it

```bash
npm install
npm run dev
```

> [!WARNING]
> Remember to set your variables (provider, API key, ...) in a `.env` file.


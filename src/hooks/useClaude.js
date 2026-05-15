import Anthropic from '@anthropic-ai/sdk';
import { buildRoadmapPrompt, buildExplanationPrompt } from '../utils/prompts.js';
import { parseRoadmapJson } from '../utils/parseRoadmap.js';

const MODEL = 'claude-sonnet-4-6';

export async function generateRoadmap(topic, apiKey) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildRoadmapPrompt(topic) }],
  });
  const raw = message.content[0].text;
  return parseRoadmapJson(raw);
}

export async function explainNode(topic, nodeLabel, apiKey, onChunk) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildExplanationPrompt(topic, nodeLabel) }],
  });
  for await (const event of await stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      onChunk(event.delta.text);
    }
  }
}

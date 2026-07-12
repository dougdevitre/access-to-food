import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MODEL, createClient, gateRequest, sendError, sendUpstreamError } from './_lib/claude';

// The model, system prompt, tool schema, and token budget are pinned
// server-side so this endpoint can't be repurposed as an open Claude proxy.
// The client only supplies conversation history.

const SYSTEM_PROMPT = `You are a helpful AI assistant for access-to-food, part of the access-to series.

Responsibilities:
- Help users find food resources and partner agencies
- Explain access-to-food programs (Emergency Food, Community Meals, Mobile Markets)
- Help people volunteer for access-to-food
- Provide donation impact information ($1 provides $6 in food and services)
- Provide access-to-food contact info: Community Support Hub | (555) 123-4567

When a user asks for food near a location or today, use the searchPantries tool to find relevant partner agencies.
When returning agency information, include:
- agency name
- address
- hours
- eligibility (if available in services)

Always respond with empathy and actionable guidance.`;

const searchPantriesTool: Anthropic.Tool = {
  name: 'searchPantries',
  description: 'Search for food pantries or distribution events. You can optionally provide a search term like a city, zip code, or name.',
  input_schema: {
    type: 'object' as const,
    properties: {
      searchTerm: {
        type: 'string',
        description: 'Optional search term to filter pantries by name, address, city, zip, or county.',
      },
    },
  },
};

const MAX_MESSAGES = 40;
const MAX_BODY_BYTES = 1_000_000;

function validateMessages(body: unknown): Anthropic.MessageParam[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const { messages } = body as { messages?: unknown };
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  for (const msg of messages) {
    if (typeof msg !== 'object' || msg === null) return null;
    const role = (msg as { role?: unknown }).role;
    if (role !== 'user' && role !== 'assistant') return null;
    if (!('content' in msg)) return null;
  }
  return messages as Anthropic.MessageParam[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!gateRequest(req, res)) return;

  if (JSON.stringify(req.body ?? '').length > MAX_BODY_BYTES) {
    sendError(res, 400, 'invalid_request', 'Request body is too large.');
    return;
  }

  const messages = validateMessages(req.body);
  if (!messages) {
    sendError(res, 400, 'invalid_request', 'Body must be {"messages": [...]} with 1-40 user/assistant entries.');
    return;
  }

  try {
    const client = createClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      system: SYSTEM_PROMPT,
      tools: [searchPantriesTool],
      messages,
    });

    // Raw content blocks so the client's tool-use loop can read tool_use ids
    // and echo the assistant turn back verbatim.
    res.status(200).json({ content: response.content, stop_reason: response.stop_reason });
  } catch (err) {
    sendUpstreamError(res, err);
  }
}

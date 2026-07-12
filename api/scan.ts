import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MODEL, createClient, gateRequest, sendError, sendUpstreamError } from './_lib/claude';

const ANALYSIS_PROMPT = `You are an expert food bank inventory analyst. Analyze this pantry shelf image in detail. Identify the food categories present (e.g., Canned Goods, Produce, Dairy, Grains, Proteins, Snacks). For each category, estimate the stock level (High, Medium, Low, Empty), provide an estimated count of visible items, determine if there is a critical shortage that requires immediate attention, suggest a recommended action (e.g., 'Restock immediately', 'Adequate supply'), and provide specific notes on the items visible (brands, types, packaging).

Respond ONLY with a valid JSON array. Each element must have this shape:
{
  "category": "string",
  "stockLevel": "High" | "Medium" | "Low" | "Empty",
  "estimatedItemCount": number,
  "criticalShortage": boolean,
  "recommendedAction": "string",
  "notes": "string"
}

Do not include any text outside the JSON array.`;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// ~4 MB decoded — headroom under Vercel's 4.5 MB request-body limit.
const MAX_BASE64_LENGTH = 5_500_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!gateRequest(req, res)) return;

  const { mimeType, base64Data } = (req.body ?? {}) as { mimeType?: unknown; base64Data?: unknown };

  if (typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    sendError(res, 400, 'invalid_request', 'mimeType must be one of image/jpeg, image/png, image/gif, image/webp.');
    return;
  }
  if (typeof base64Data !== 'string' || base64Data.length === 0) {
    sendError(res, 400, 'invalid_request', 'base64Data must be a non-empty base64 string (without the data: prefix).');
    return;
  }
  if (base64Data.length > MAX_BASE64_LENGTH) {
    sendError(res, 413, 'image_too_large', 'Image is too large. Please use a photo under ~4 MB.');
    return;
  }

  try {
    const client = createClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: 'disabled' },
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as AllowedMimeType,
              data: base64Data,
            },
          },
          { type: 'text', text: ANALYSIS_PROMPT },
        ],
      }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      sendError(res, 502, 'parse_error', 'The AI returned no analysis for this image.');
      return;
    }

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    try {
      const items = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text.trim());
      if (!Array.isArray(items)) throw new Error('not an array');
      res.status(200).json({ items });
    } catch {
      sendError(res, 502, 'parse_error', 'The AI response could not be parsed. Please try again.');
    }
  } catch (err) {
    sendUpstreamError(res, err);
  }
}

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { issueShiftToken } from "../lib/token.js";
import { getHmacKey } from "../lib/secrets.js";
import { json, parseBody } from "../lib/http.js";
import { validEventCode } from "../lib/validate.js";
import type { Mode } from "../types.js";

interface Body { mode?: Mode; eventCode?: string }

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = parseBody<Body>(event.body) ?? {};
  const mode: Mode = body.mode === "team" ? "team" : "solo";
  let eventCode: string | undefined;
  if (mode === "team") {
    eventCode = (body.eventCode ?? "").toUpperCase();
    if (!validEventCode(eventCode)) return json(422, { error: "invalid_event_code" });
  }
  const key = await getHmacKey();
  return json(200, { token: issueShiftToken(key, mode, eventCode) });
}

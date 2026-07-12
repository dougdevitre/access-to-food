import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { verifyShiftToken } from "../lib/token.js";
import { getHmacKey } from "../lib/secrets.js";
import { json, parseBody } from "../lib/http.js";
import { sanitizeInitials, elapsedOk, plausibleScore } from "../lib/validate.js";
import { ddb, TABLE, keys, padMeals, nowTtl, SCORE_TTL_DAYS } from "../lib/ddb.js";
import type { ScoreSubmission } from "../types.js";

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = parseBody<ScoreSubmission>(event.body);
  if (!body?.token) return json(400, { error: "missing_body" });

  const key = await getHmacKey();
  const payload = verifyShiftToken(key, body.token);
  if (!payload) return json(401, { error: "bad_token" });
  if (!elapsedOk(payload.iat)) return json(422, { error: "implausible_duration" });

  const initials = sanitizeInitials(body.initials);
  if (!initials) return json(422, { error: "invalid_initials", hint: "1-3 letters, keep it clean" });
  if (!plausibleScore(body.meals, body.lbs, body.flagged ?? 0)) return json(422, { error: "implausible_score" });

  const id = ulid();
  const durationMs = Date.now() - payload.iat;
  const common = {
    initials,
    meals: body.meals,
    lbs: body.lbs,
    flagged: body.flagged ?? 0,
    durationMs,
    ts: new Date().toISOString(),
    ttl: nowTtl(SCORE_TTL_DAYS),
    gsi1sk: `${padMeals(body.meals)}#${id}`,
    ...(payload.eventCode ? { eventCode: payload.eventCode } : {}),
  };

  // Single-use token + global score, atomically. Replay -> transaction cancels -> 409.
  try {
    await ddb.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE,
            Item: { ...keys.token(payload.jti), used: true, ttl: nowTtl(1) },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: { ...keys.scoreGlobal(id), gsi1pk: keys.lbGlobal(), ...common },
          },
        },
      ],
    }));
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === "TransactionCanceledException") return json(409, { error: "already_posted" });
    console.error("submitScore transact failed", err);
    return json(500, { error: "internal" });
  }

  // Team copy is best-effort after the atomic global write.
  if (payload.eventCode) {
    try {
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: { ...keys.scoreEvent(payload.eventCode, id), gsi1pk: keys.lbEvent(payload.eventCode), ...common },
      }));
    } catch (err) {
      console.error("team score write failed", err);
    }
  }

  return json(200, { ok: true, id, meals: body.meals, eventCode: payload.eventCode ?? null });
}

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { json, parseBody } from "../lib/http.js";
import { ddb, TABLE, keys } from "../lib/ddb.js";
import { verifyShiftToken } from "../lib/token.js";
import { getHmacKey } from "../lib/secrets.js";
import { verifyCoordinator } from "../lib/auth.js";
import type { MissBatch } from "../types.js";

const CATS = new Set(["produce", "protein", "pantry", "discard", "timeout"]);

export async function submitHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = parseBody<MissBatch>(event.body);
  if (!body?.token || !Array.isArray(body.misses)) return json(400, { error: "missing_body" });
  const key = await getHmacKey();
  if (!verifyShiftToken(key, body.token)) return json(401, { error: "bad_token" });

  const batch = body.misses.slice(0, 20).filter(
    (m) => CATS.has(m.actual) && CATS.has(m.chosen) && Number.isInteger(m.n) && m.n > 0 && m.n <= 60,
  );
  for (const m of batch) {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: keys.miss(m.actual, m.chosen),
      UpdateExpression: "ADD #c :n",
      ExpressionAttributeNames: { "#c": "count" },
      ExpressionAttributeValues: { ":n": m.n },
    }));
  }
  return json(200, { ok: true, recorded: batch.length });
}

export async function readHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const userId = await verifyCoordinator(event);
  if (!userId) return json(401, { error: "unauthorized" });
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "pk = :p",
    ExpressionAttributeValues: { ":p": "STATS#MISS" },
  }));
  const rows = (res.Items ?? [])
    .map((i) => ({ pattern: i.sk as string, count: (i.count as number) ?? 0 }))
    .sort((a, b) => b.count - a.count);
  return json(200, { rows });
}

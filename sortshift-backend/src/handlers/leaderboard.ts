import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { json } from "../lib/http.js";
import { ddb, TABLE, keys } from "../lib/ddb.js";
import { validEventCode } from "../lib/validate.js";

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const code = event.pathParameters?.code?.toUpperCase();
  if (code && !validEventCode(code)) return json(422, { error: "invalid_event_code" });
  const limit = Math.min(Number(event.queryStringParameters?.limit ?? 10) || 10, 50);

  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "gsi1",
    KeyConditionExpression: "gsi1pk = :p",
    ExpressionAttributeValues: { ":p": code ? keys.lbEvent(code) : keys.lbGlobal() },
    ScanIndexForward: false,
    Limit: limit,
  }));

  const rows = (res.Items ?? []).map((i) => ({
    initials: i.initials as string,
    meals: i.meals as number,
    flagged: i.flagged as number,
    ts: i.ts as string,
    eventCode: (i.eventCode as string | undefined) ?? null,
  }));
  return json(200, { scope: code ?? "global", rows });
}

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { json } from "../lib/http.js";
import { ddb, TABLE, keys } from "../lib/ddb.js";
import { toCsv } from "../lib/csv.js";
import { validEventCode } from "../lib/validate.js";
import { verifyCoordinator } from "../lib/auth.js";

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const userId = await verifyCoordinator(event);
  if (!userId) return json(401, { error: "unauthorized" });

  const scope = event.queryStringParameters?.scope === "event" ? "event" : "global";
  const code = event.queryStringParameters?.code?.toUpperCase();
  if (scope === "event" && (!code || !validEventCode(code))) return json(422, { error: "invalid_event_code" });

  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "gsi1",
    KeyConditionExpression: "gsi1pk = :p",
    ExpressionAttributeValues: { ":p": scope === "event" && code ? keys.lbEvent(code) : keys.lbGlobal() },
    ScanIndexForward: false,
    Limit: 100,
  }));

  const csv = toCsv(
    ["initials", "meals", "flagged", "date", "team"],
    (res.Items ?? []).map((i) => [
      i.initials as string, i.meals as number, (i.flagged as number) ?? 0,
      (i.ts as string).slice(0, 10), (i.eventCode as string | undefined) ?? "",
    ]),
  );
  return { statusCode: 200, headers: { "content-type": "text/csv" }, body: csv };
}

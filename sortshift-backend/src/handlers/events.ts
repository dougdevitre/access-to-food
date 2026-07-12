import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { json, parseBody } from "../lib/http.js";
import { ddb, TABLE, keys } from "../lib/ddb.js";
import { validEventCode, generateEventCode } from "../lib/validate.js";
import { verifyCoordinator } from "../lib/auth.js";

interface CreateBody { code?: string; name?: string; expiresAt?: string }

export async function createHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const userId = await verifyCoordinator(event);
  if (!userId) return json(401, { error: "unauthorized" });

  const body = parseBody<CreateBody>(event.body) ?? {};
  const code = (body.code ?? generateEventCode()).toUpperCase();
  if (!validEventCode(code)) return json(422, { error: "invalid_event_code" });

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        ...keys.eventMeta(code),
        name: body.name ?? code,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        expiresAt: body.expiresAt ?? null,
        status: "open",
      },
      ConditionExpression: "attribute_not_exists(pk)",
    }));
  } catch (err) {
    if ((err as { name?: string }).name === "ConditionalCheckFailedException") {
      return json(409, { error: "code_taken" });
    }
    throw err;
  }
  return json(200, { code });
}

export async function getHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const code = event.pathParameters?.code?.toUpperCase();
  if (!code || !validEventCode(code)) return json(422, { error: "invalid_event_code" });
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: keys.eventMeta(code) }));
  if (!res.Item) return json(404, { error: "not_found" });
  return json(200, { code, name: res.Item.name, status: res.Item.status });
}

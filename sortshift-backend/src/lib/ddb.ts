import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const TABLE = process.env.TABLE_NAME ?? "sortshift-dev";
export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

export const padMeals = (m: number) => String(m).padStart(6, "0");

export const keys = {
  eventMeta: (code: string) => ({ pk: `EVENT#${code}`, sk: "META" }),
  scoreEvent: (code: string, id: string) => ({ pk: `EVENT#${code}`, sk: `SCORE#${id}` }),
  scoreGlobal: (id: string) => ({ pk: "GLOBAL", sk: `SCORE#${id}` }),
  lbEvent: (code: string) => `LB#EVENT#${code}`,
  lbGlobal: () => "LB#GLOBAL",
  miss: (actual: string, chosen: string) => ({ pk: "STATS#MISS", sk: `${actual}#${chosen}` }),
  token: (jti: string) => ({ pk: `TOKEN#${jti}`, sk: "META" }),
};

export const SCORE_TTL_DAYS = 180;
export const nowTtl = (days: number) => Math.floor(Date.now() / 1000) + days * 86_400;

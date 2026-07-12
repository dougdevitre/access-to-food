import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({});
const cache = new Map<string, string>();

/** Fetch a SecureString from SSM with in-Lambda caching. Env override (HMAC_KEY) supports local/dev/test. */
export async function getHmacKey(): Promise<string> {
  if (process.env.HMAC_KEY) return process.env.HMAC_KEY;
  const name = process.env.HMAC_KEY_PARAM ?? "/sortshift/dev/hmac-key";
  const hit = cache.get(name);
  if (hit) return hit;
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  const v = res.Parameter?.Value;
  if (!v) throw new Error("HMAC key parameter missing");
  cache.set(name, v);
  return v;
}

import { createRemoteJWKSet, jwtVerify } from "jose";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/** Verify a Clerk-issued JWT from the Authorization header. Returns userId (sub) or null. */
export async function verifyCoordinator(event: APIGatewayProxyEventV2): Promise<string | null> {
  const auth = event.headers?.authorization ?? event.headers?.Authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const jwksUrl = process.env.CLERK_JWKS_URL;
  const issuer = process.env.CLERK_ISSUER;
  if (!jwksUrl || !issuer) return null;
  try {
    jwks = jwks ?? createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jwtVerify(token, jwks, { issuer });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

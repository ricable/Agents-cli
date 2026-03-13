/**
 * companion/clerk-auth.ts — Clerk JWT verification for the companion web service.
 *
 * Wraps node:http IncomingMessage into a Fetch Request and calls
 * createClerkClient().authenticateRequest() to verify Clerk session tokens.
 *
 * This is the canonical location for all @clerk/backend imports.
 */

import { createClerkClient } from "@clerk/backend";
import type { IncomingMessage } from "node:http";

// ── Types ──────────────────────────────────────────────────────────────

export interface ClerkSession {
  readonly userId: string;
  readonly sessionId: string;
  readonly email?: string;
  readonly publicMetadata: Record<string, unknown>;
}

export interface ClerkConfig {
  readonly secretKey: string;
  readonly publishableKey?: string;
}

// ── Verification ───────────────────────────────────────────────────────

/**
 * Verify a Clerk session token from an IncomingMessage.
 * Returns ClerkSession on success, null on any failure.
 */
export async function verifyClerkToken(
  req: IncomingMessage,
  config: ClerkConfig,
): Promise<ClerkSession | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const clerk = createClerkClient({ secretKey: config.secretKey });

    // Wrap IncomingMessage into a Fetch Request for Clerk SDK compatibility
    const url = `http://localhost${req.url ?? "/"}`;
    const fetchHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value) continue;
      if (Array.isArray(value)) {
        for (const v of value) fetchHeaders.append(key, v);
      } else {
        fetchHeaders.set(key, value);
      }
    }
    const fetchReq = new Request(url, { headers: fetchHeaders });

    const authResult = await clerk.authenticateRequest(fetchReq, {
      publishableKey: config.publishableKey,
    });

    if (!authResult.isSignedIn) return null;

    const auth = authResult.toAuth();
    if (!auth) return null;

    const userId = auth.userId ?? "";
    const sessionId = auth.sessionId ?? "";
    if (!userId || !sessionId) return null;

    // Fetch user details for email (non-fatal if unavailable)
    let email: string | undefined;
    try {
      const user = await clerk.users.getUser(userId);
      email = user.emailAddresses[0]?.emailAddress;
    } catch {
      // Non-fatal
    }

    return {
      userId,
      sessionId,
      email,
      publicMetadata:
        (auth.sessionClaims?.["publicMetadata"] as Record<string, unknown>) ?? {},
    };
  } catch {
    return null;
  }
}

/**
 * Update a Clerk user's public metadata.
 * Used to store stripeCustomerId after creation.
 */
export async function updateUserMetadata(
  userId: string,
  metadata: Record<string, unknown>,
  config: ClerkConfig,
): Promise<void> {
  const clerk = createClerkClient({ secretKey: config.secretKey });
  await clerk.users.updateUserMetadata(userId, { publicMetadata: metadata });
}

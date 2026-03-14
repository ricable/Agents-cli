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
  /**
   * Allowlist of frontend origins permitted to use Clerk JWTs against this API.
   * Prevents token reuse across apps (e.g. ['https://ui.spectredve.com', 'http://localhost:3100']).
   * Reads CLERK_AUTHORIZED_PARTIES env var (comma-separated) when not set explicitly.
   */
  readonly authorizedParties?: string[];
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

    // Resolve authorizedParties: explicit config → env var → undefined (permissive)
    const authorizedParties =
      config.authorizedParties ??
      process.env["CLERK_AUTHORIZED_PARTIES"]?.split(",").map((s) => s.trim()).filter(Boolean);

    const authResult = await clerk.authenticateRequest(fetchReq, {
      publishableKey: config.publishableKey,
      authorizedParties,
    });

    // 'handshake' = multi-domain cookie sync redirect — not applicable to JSON API
    if (authResult.status === "handshake" || !authResult.isSignedIn) return null;

    const auth = authResult.toAuth();
    if (!auth) return null;

    const userId = auth.userId ?? "";
    const sessionId = auth.sessionId ?? "";
    if (!userId || !sessionId) return null;

    // Fetch user to get email + publicMetadata (more reliable than session claims)
    let email: string | undefined;
    let publicMetadata: Record<string, unknown> = {};
    try {
      const user = await clerk.users.getUser(userId);
      email = user.emailAddresses[0]?.emailAddress;
      publicMetadata = (user.publicMetadata as Record<string, unknown>) ?? {};
    } catch {
      // Non-fatal — fall back to session claims for publicMetadata
      publicMetadata =
        (auth.sessionClaims?.["public_metadata"] as Record<string, unknown>) ??
        (auth.sessionClaims?.["publicMetadata"] as Record<string, unknown>) ?? {};
    }

    return { userId, sessionId, email, publicMetadata };
  } catch {
    return null;
  }
}

/**
 * Update a Clerk user's public metadata.
 * Merges new fields into existing metadata (does not overwrite unrelated fields).
 * Used to store stripeCustomerId, tier, etc.
 */
export async function updateUserMetadata(
  userId: string,
  metadata: Record<string, unknown>,
  config: ClerkConfig,
): Promise<void> {
  const clerk = createClerkClient({ secretKey: config.secretKey });

  // Fetch existing metadata and merge to avoid overwriting unrelated fields
  let existing: Record<string, unknown> = {};
  try {
    const user = await clerk.users.getUser(userId);
    existing = (user.publicMetadata as Record<string, unknown>) ?? {};
  } catch {
    // Non-fatal — proceed with provided metadata only
  }

  const merged = { ...existing, ...metadata };
  await clerk.users.updateUserMetadata(userId, { publicMetadata: merged });
}

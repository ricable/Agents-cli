/**
 * Tests for companion/clerk-auth.ts — Clerk JWT verification.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IncomingMessage } from "node:http";

// ── Mock @clerk/backend ──────────────────────────────────────────────

vi.mock("@clerk/backend", () => ({
  createClerkClient: vi.fn(),
}));

import { createClerkClient } from "@clerk/backend";
import { verifyClerkToken, updateUserMetadata } from "../lib/companion/clerk-auth.js";
import type { ClerkConfig } from "../lib/companion/clerk-auth.js";

const mockConfig: ClerkConfig = {
  secretKey: "sk_test_mock",
  publishableKey: "pk_test_mock",
};

function makeReq(authHeader?: string): IncomingMessage {
  return {
    url: "/api/test",
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as IncomingMessage;
}

// ── verifyClerkToken ──────────────────────────────────────────────────

describe("verifyClerkToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no Authorization header", async () => {
    const result = await verifyClerkToken(makeReq(), mockConfig);
    expect(result).toBeNull();
  });

  it("returns null when Authorization header is not Bearer", async () => {
    const result = await verifyClerkToken(makeReq("Basic abc123"), mockConfig);
    expect(result).toBeNull();
  });

  it("returns null when Clerk authenticateRequest fails (invalid token)", async () => {
    vi.mocked(createClerkClient).mockReturnValue({
      authenticateRequest: vi.fn().mockResolvedValue({ isSignedIn: false }),
      users: { getUser: vi.fn() },
    } as unknown as ReturnType<typeof createClerkClient>);

    const result = await verifyClerkToken(makeReq("Bearer bad_token"), mockConfig);
    expect(result).toBeNull();
  });

  it("returns ClerkSession on valid token", async () => {
    const mockAuth = {
      userId: "user_123",
      sessionId: "sess_abc",
      sessionClaims: { publicMetadata: { stripeCustomerId: "cus_xyz" } },
    };

    vi.mocked(createClerkClient).mockReturnValue({
      authenticateRequest: vi.fn().mockResolvedValue({
        isSignedIn: true,
        toAuth: () => mockAuth,
      }),
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [{ emailAddress: "alice@example.com" }],
          publicMetadata: { stripeCustomerId: "cus_xyz" },
        }),
      },
    } as unknown as ReturnType<typeof createClerkClient>);

    const result = await verifyClerkToken(makeReq("Bearer valid_token"), mockConfig);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user_123");
    expect(result?.sessionId).toBe("sess_abc");
    expect(result?.email).toBe("alice@example.com");
    expect(result?.publicMetadata).toEqual({ stripeCustomerId: "cus_xyz" });
  });

  it("returns session without email if getUser throws", async () => {
    const mockAuth = {
      userId: "user_456",
      sessionId: "sess_def",
      sessionClaims: {},
    };

    vi.mocked(createClerkClient).mockReturnValue({
      authenticateRequest: vi.fn().mockResolvedValue({
        isSignedIn: true,
        toAuth: () => mockAuth,
      }),
      users: {
        getUser: vi.fn().mockRejectedValue(new Error("User not found")),
      },
    } as unknown as ReturnType<typeof createClerkClient>);

    const result = await verifyClerkToken(makeReq("Bearer valid_token"), mockConfig);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user_456");
    expect(result?.email).toBeUndefined();
  });

  it("returns null if authenticateRequest throws", async () => {
    vi.mocked(createClerkClient).mockReturnValue({
      authenticateRequest: vi.fn().mockRejectedValue(new Error("Network error")),
      users: { getUser: vi.fn() },
    } as unknown as ReturnType<typeof createClerkClient>);

    const result = await verifyClerkToken(makeReq("Bearer some_token"), mockConfig);
    expect(result).toBeNull();
  });
});

// ── updateUserMetadata ────────────────────────────────────────────────

describe("updateUserMetadata", () => {
  it("calls clerk.users.updateUserMetadata with correct params", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({});
    vi.mocked(createClerkClient).mockReturnValue({
      users: { updateUserMetadata: mockUpdate },
    } as unknown as ReturnType<typeof createClerkClient>);

    await updateUserMetadata("user_123", { stripeCustomerId: "cus_abc" }, mockConfig);
    expect(mockUpdate).toHaveBeenCalledWith("user_123", {
      publicMetadata: { stripeCustomerId: "cus_abc" },
    });
  });
});

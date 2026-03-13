/**
 * companion/oauth.ts — OAuth2 PKCE flow manager for paid app credentials.
 *
 * Supports Zoom, Slack, GitHub, Google with configurable client IDs.
 * Uses S256 code challenge method per RFC 7636.
 */

import { randomBytes, createHash } from "node:crypto";
import { toErrorMessage } from "../output.js";
import { isPrivateUrl } from "../resolver.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface OAuthConfig {
  provider: string;
  clientId: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// ── PKCE Helpers ───────────────────────────────────────────────────────

/**
 * Generate a cryptographically random code verifier (43-128 chars, RFC 7636).
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Derive S256 code challenge from verifier (RFC 7636 Section 4.2).
 */
export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Generate a random state parameter for CSRF protection.
 */
export function generateState(): string {
  return randomBytes(16).toString("hex");
}

// ── Default Configs ────────────────────────────────────────────────────

const DEFAULT_CONFIGS: Record<string, Omit<OAuthConfig, "clientId">> = {
  zoom: {
    provider: "zoom",
    authUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    scopes: ["meeting:write", "user:read"],
  },
  slack: {
    provider: "slack",
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["chat:write", "channels:read", "users:read"],
  },
  github: {
    provider: "github",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["repo", "read:user"],
  },
  google: {
    provider: "google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "email", "profile"],
  },
};

/**
 * Build default OAuthConfig map from environment variables.
 * Reads ZOOM_CLIENT_ID, SLACK_CLIENT_ID, GITHUB_OAUTH_CLIENT_ID, GOOGLE_CLIENT_ID.
 */
export function buildDefaultConfigs(): Map<string, OAuthConfig> {
  const envMap: Record<string, string> = {
    zoom: "ZOOM_CLIENT_ID",
    slack: "SLACK_CLIENT_ID",
    github: "GITHUB_OAUTH_CLIENT_ID",
    google: "GOOGLE_CLIENT_ID",
  };

  const configs = new Map<string, OAuthConfig>();
  for (const [provider, base] of Object.entries(DEFAULT_CONFIGS)) {
    const envKey = envMap[provider];
    const clientId = envKey ? (process.env[envKey] ?? "") : "";
    configs.set(provider, { ...base, clientId });
  }
  return configs;
}

// ── OAuthManager ───────────────────────────────────────────────────────

export class OAuthManager {
  private readonly configs: Map<string, OAuthConfig>;

  constructor(configs: Map<string, OAuthConfig>) {
    this.configs = configs;
  }

  /**
   * Get available provider names.
   */
  listProviders(): string[] {
    return [...this.configs.keys()];
  }

  /**
   * Get config for a provider, or null if not configured.
   */
  getConfig(provider: string): OAuthConfig | null {
    return this.configs.get(provider) ?? null;
  }

  /**
   * Initiate OAuth2 PKCE flow. Returns the authorization URL, state, and code verifier.
   * The caller must store state + codeVerifier for the callback.
   */
  initiateFlow(
    provider: string,
    redirectUri: string,
  ): { authUrl: string; state: string; codeVerifier: string } {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }
    if (!config.clientId) {
      throw new Error(`No client ID configured for ${provider}. Set the appropriate environment variable.`);
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    // Google requires access_type=offline for refresh tokens
    if (provider === "google") {
      params.set("access_type", "offline");
      params.set("prompt", "consent");
    }

    return {
      authUrl: `${config.authUrl}?${params.toString()}`,
      state,
      codeVerifier,
    };
  }

  /**
   * Complete the OAuth2 PKCE flow by exchanging the authorization code for tokens.
   */
  async completeFlow(
    provider: string,
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<OAuthTokenResponse> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }
    if (!config.clientId) {
      throw new Error(`No client ID configured for ${provider}`);
    }

    // SSRF check on token URL
    if (isPrivateUrl(config.tokenUrl)) {
      throw new Error(`Token URL resolves to private network: ${config.tokenUrl}`);
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      code_verifier: codeVerifier,
    });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      // GitHub requires Accept: application/json
      if (provider === "github") {
        headers["Accept"] = "application/json";
      }

      const res = await fetch(config.tokenUrl, {
        method: "POST",
        headers,
        body: params.toString(),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token exchange failed (${res.status}): ${text.slice(0, 200)}`);
      }

      const json = await res.json() as Record<string, unknown>;

      // Normalize different provider response formats
      const accessToken = (json["access_token"] as string) ?? "";
      const refreshToken = (json["refresh_token"] as string) ?? undefined;
      const expiresIn = typeof json["expires_in"] === "number"
        ? json["expires_in"]
        : 3600; // Default 1 hour

      if (!accessToken) {
        throw new Error("No access_token in token response");
      }

      return { accessToken, refreshToken, expiresIn };
    } catch (err) {
      throw new Error(`OAuth token exchange failed for ${provider}: ${toErrorMessage(err)}`);
    }
  }
}

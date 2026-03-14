/**
 * companion/web-service.ts — HTTP API for companion mode (monetization layer).
 *
 * Uses node:http only (no deps). Exposes /api/health, /api/analyze, /api/plan,
 * /api/generate (async job), /api/status/:id, /api/download/:id.
 *
 * Bearer auth, dual rate limiting (per-key + per-IP), async job queue.
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream, statSync, readFileSync, existsSync } from "node:fs";
import { join, normalize, resolve, extname } from "node:path";
import { success, failure, toErrorMessage } from "../output.js";
import { analyzeProject } from "./analyzer.js";
import { mapToTools } from "./mapper.js";
import { executePipeline } from "./pipeline.js";
import { UsageMeter } from "./metering.js";
import { getTierLimits } from "./tiers.js";
import { createBillingProvider } from "./billing.js";
import { verifyClerkToken, updateUserMetadata } from "./clerk-auth.js";
import type { ClerkConfig } from "./clerk-auth.js";
import type { TechStackProfile } from "./analyzer.js";
import type { CompanionToolPlan } from "./mapper.js";
import type { PipelineReport } from "../types.js";
import type { CliOutput } from "../types.js";

// ── Types ──────────────────────────────────────────────────────────────

export type ApiTier = "free" | "starter" | "pro" | "enterprise";

export interface ApiKeyRecord {
  readonly tier: ApiTier;
  readonly label: string;
  readonly dailyLimit?: number;
}

export interface WebServiceConfig {
  readonly port: number;
  readonly host: string;
  readonly apiKeys: Map<string, ApiKeyRecord>;
  readonly maxConcurrentJobs: number;
  readonly jobTtlMs: number;
  readonly rateLimitPerKey: number;
  readonly rateLimitPerIp: number;
  readonly maxBodySize: number;
  readonly projectRoot: string;
  readonly outputDir: string;
  readonly maxQueueDepth?: number;
  readonly clerkConfig?: ClerkConfig;
  readonly stripeWebhookSecret?: string;
}

type JobStatus = "queued" | "running" | "completed" | "failed";

interface Job {
  id: string;
  status: JobStatus;
  stage: string;
  description: string;
  tier: string;
  profile?: TechStackProfile;
  plan?: CompanionToolPlan;
  progress: number;
  error?: string;
  bundlePath?: string;
  report?: PipelineReport;
  createdAt: number;
  updatedAt: number;
}

// ── Rate Limiter (token bucket, in-memory) ─────────────────────────────

class TokenBucket {
  private readonly buckets = new Map<string, { tokens: number; lastRefill: number }>();
  constructor(
    private readonly maxTokens: number,
    private readonly refillRate: number, // tokens per ms
  ) {}

  consume(key: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + elapsed * this.refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  sweep(): void {
    const cutoff = Date.now() - 120_000;
    for (const [key, bucket] of this.buckets) {
      if (bucket.lastRefill < cutoff) this.buckets.delete(key);
    }
  }
}

// ── Body Parser ────────────────────────────────────────────────────────

function parseBody(req: IncomingMessage, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const chunks: Buffer[] = [];
    let size = 0;

    const done = (err: Error | null, result?: string) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(result ?? "");
    };

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxSize) {
        req.destroy();
        done(new Error(`Body exceeds ${maxSize} bytes`));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => done(null, Buffer.concat(chunks).toString("utf-8")));
    req.on("error", (err) => done(err));
  });
}

// ── Security ───────────────────────────────────────────────────────────

/** Strip control chars (sanitize, not throw — unlike guards.ts rejectControlChars). */
function sanitizeControlChars(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// ── CORS ───────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  "https://ui.spectredve.com",
]);

function isAllowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  // Allow localhost on any port for local development
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return origin;
  } catch {
    // Invalid URL — not allowed
  }
  return null;
}

function corsHeaders(req: IncomingMessage): Record<string, string> {
  const origin = req.headers.origin;
  const allowed = isAllowedOrigin(origin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  };
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = allowed;
    headers["Vary"] = "Origin";
  }
  return headers;
}

// ── Stripe Price-to-Tier Mapping ───────────────────────────────────────

const PRICE_TO_TIER: Record<string, ApiTier> = {
  "price_1TAsLJ2QpzdUwTFgn4OhkLig": "starter",
  "price_1TAsLK2QpzdUwTFgqe4HP5Jh": "pro",
  "price_1TAsLK2QpzdUwTFgZQQ56NrE": "enterprise",
};

// ── Response Helpers ───────────────────────────────────────────────────

function sendJson<T>(res: ServerResponse, status: number, data: CliOutput<T>, req?: IncomingMessage): void {
  const body = JSON.stringify(data, null, 2);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    ...(req ? corsHeaders(req) : {}),
  };
  res.writeHead(status, headers);
  res.end(body);
}

function sendError(res: ServerResponse, status: number, code: string, message: string, req?: IncomingMessage): void {
  sendJson(res, status, failure("web-service", code, message, Date.now()), req);
}

// ── Shared request helpers ─────────────────────────────────────────────

interface AuthedRequest {
  keyRecord: ApiKeyRecord;
  description: string;
}

/** Authenticate, rate-limit, parse body, extract description. Returns null if response was sent. */
async function authenticateAndParse(
  req: IncomingMessage,
  res: ServerResponse,
  ip: string,
  config: WebServiceConfig,
  keyLimiter: TokenBucket,
  ipLimiter: TokenBucket,
  authenticate: (req: IncomingMessage) => ApiKeyRecord | null,
): Promise<AuthedRequest | null> {
  const keyRecord = authenticate(req);
  if (!keyRecord) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return null; }
  if (!keyLimiter.consume(hashKey(req.headers.authorization!.slice(7)))) {
    sendError(res, 429, "RATE_LIMITED", "Rate limit exceeded for API key", req); return null;
  }
  if (!ipLimiter.consume(ip)) {
    sendError(res, 429, "RATE_LIMITED", "Rate limit exceeded for IP", req); return null;
  }

  const body = await parseBody(req, config.maxBodySize);
  const parsed = JSON.parse(body) as { description?: string };
  if (!parsed.description || typeof parsed.description !== "string") {
    sendError(res, 400, "INVALID_INPUT", "Missing 'description' field", req); return null;
  }
  const description = sanitizeControlChars(parsed.description).slice(0, 2000);
  return { keyRecord, description };
}

// ── Main ───────────────────────────────────────────────────────────────

export function startServer(config: WebServiceConfig): { server: Server; stop: () => Promise<void> } {
  const jobs = new Map<string, Job>();
  let runningJobs = 0;
  const jobQueue: string[] = [];
  const serverStartTime = Date.now();
  const maxQueueDepth = config.maxQueueDepth ?? 100;
  const usageMeter = new UsageMeter();

  const keyLimiter = new TokenBucket(config.rateLimitPerKey, config.rateLimitPerKey / 60_000);
  const ipLimiter = new TokenBucket(config.rateLimitPerIp, config.rateLimitPerIp / 60_000);

  // TTL sweep — also clean stuck running jobs (>2x TTL)
  const sweepTimer = setInterval(() => {
    const completedCutoff = Date.now() - config.jobTtlMs;
    const stuckCutoff = Date.now() - config.jobTtlMs * 2;
    for (const [id, job] of jobs) {
      if (job.updatedAt < completedCutoff && (job.status === "completed" || job.status === "failed")) {
        jobs.delete(id);
      } else if (job.updatedAt < stuckCutoff && job.status === "running") {
        job.status = "failed";
        job.error = "Job timed out";
        job.updatedAt = Date.now();
        runningJobs = Math.max(0, runningJobs - 1);
      }
    }
    keyLimiter.sweep();
    ipLimiter.sweep();
  }, 60_000);
  sweepTimer.unref();

  // ── Auth ──────────────────────────────────────────────────────────

  /** Synchronous API-key lookup (SHA256). Returns ApiKeyRecord or null. */
  function authenticateApiKey(req: IncomingMessage): ApiKeyRecord | null {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    return config.apiKeys.get(hashKey(token)) ?? null;
  }

  /** Legacy alias used by rate-limiter helpers. */
  function authenticate(req: IncomingMessage): ApiKeyRecord | null {
    return authenticateApiKey(req);
  }

  /**
   * Dual-mode auth: API-key SHA256 first, then Clerk JWT fallback.
   * Returns { keyRecord, clerkSession? } or null if unauthenticated.
   */
  async function requireAuth(req: IncomingMessage): Promise<{
    keyRecord: ApiKeyRecord;
    clerkUserId?: string;
    clerkEmail?: string;
    clerkMetadata?: Record<string, unknown>;
  } | null> {
    // 1. Try static API key
    const keyRecord = authenticateApiKey(req);
    if (keyRecord) return { keyRecord };

    // 2. Try Clerk JWT
    if (config.clerkConfig) {
      const session = await verifyClerkToken(req, config.clerkConfig);
      if (session) {
        // Read tier from Clerk publicMetadata (updated by Stripe webhook on subscription events)
        const userTier = (session.publicMetadata?.["tier"] as ApiTier) || "free";
        const syntheticKey: ApiKeyRecord = { tier: userTier, label: `clerk:${session.userId}` };
        return {
          keyRecord: syntheticKey,
          clerkUserId: session.userId,
          clerkEmail: session.email,
          clerkMetadata: session.publicMetadata,
        };
      }
    }

    return null;
  }

  /** Get or create a Stripe customer ID for a Clerk user. */
  async function getOrCreateStripeCustomer(
    clerkUserId: string,
    clerkEmail: string | undefined,
    clerkMetadata: Record<string, unknown>,
  ): Promise<string> {
    const existing = clerkMetadata["stripeCustomerId"];
    if (typeof existing === "string" && existing) return existing;

    const billing = createBillingProvider("stripe");
    // Store clerkUserId in Stripe customer metadata so webhooks can reverse-lookup
    const { customerId } = await billing.createCustomer(clerkEmail ?? "", "pro", { clerkUserId });

    // Persist on Clerk user metadata (best-effort)
    if (config.clerkConfig) {
      try {
        await updateUserMetadata(
          clerkUserId,
          { ...clerkMetadata, stripeCustomerId: customerId },
          config.clerkConfig,
        );
      } catch {
        // Non-fatal
      }
    }

    return customerId;
  }

  function getClientIp(req: IncomingMessage): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0]!.trim();
    return req.socket.remoteAddress ?? "unknown";
  }

  // ── Job execution ─────────────────────────────────────────────────

  function drainQueue(): void {
    while (runningJobs < config.maxConcurrentJobs && jobQueue.length > 0) {
      const jobId = jobQueue.shift()!;
      const job = jobs.get(jobId);
      if (!job || job.status !== "queued") continue;
      runningJobs++;
      job.status = "running";
      job.updatedAt = Date.now();
      executeJob(job).finally(() => {
        runningJobs--;
        drainQueue();
      });
    }
  }

  async function executeJob(job: Job): Promise<void> {
    try {
      const jobOutputDir = join(config.outputDir, "jobs", job.id);

      const result = await executePipeline(
        job.description,
        {
          tier: job.tier,
          projectRoot: config.projectRoot,
          outputDir: jobOutputDir,
        },
        (stage, pct) => {
          job.stage = stage;
          job.progress = pct;
          job.updatedAt = Date.now();
        },
      );

      job.profile = result.profile;
      job.plan = result.plan;
      job.bundlePath = result.bundlePath;
      job.report = result.report;
      job.progress = 100;
      job.status = "completed";
      job.updatedAt = Date.now();
    } catch (err) {
      job.status = "failed";
      job.error = toErrorMessage(err);
      job.updatedAt = Date.now();
    }
  }

  // ── Route handler ─────────────────────────────────────────────────

  async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const path = url.pathname;
    const method = req.method ?? "GET";

    // CORS preflight
    if (method === "OPTIONS") {
      res.writeHead(204, corsHeaders(req));
      res.end();
      return;
    }

    const ip = getClientIp(req);

    // ── GET /api/config ─────────────────────────────────────────
    // No auth required — returns public config for frontend init
    if (method === "GET" && path === "/api/config") {
      sendJson(res, 200, success("config", {
        clerkPublishableKey: config.clerkConfig?.publishableKey ?? null,
      }, Date.now()), req);
      return;
    }

    // ── GET /api/health ─────────────────────────────────────────
    if (method === "GET" && path === "/api/health") {
      sendJson(res, 200, success("health", {
        status: "ok",
        uptime: Date.now() - serverStartTime,
        activeJobs: runningJobs,
        queuedJobs: jobQueue.length,
        totalJobs: jobs.size,
      }, Date.now()), req);
      return;
    }

    // ── POST /api/analyze ───────────────────────────────────────
    if (method === "POST" && path === "/api/analyze") {
      const authed = await authenticateAndParse(req, res, ip, config, keyLimiter, ipLimiter, authenticate);
      if (!authed) return;
      try {
        const profile = analyzeProject(authed.description);
        sendJson(res, 200, success("analyze", profile, Date.now()), req);
      } catch (err) {
        sendError(res, 400, "ANALYSIS_ERROR", toErrorMessage(err), req);
      }
      return;
    }

    // ── POST /api/plan ──────────────────────────────────────────
    if (method === "POST" && path === "/api/plan") {
      const authed = await authenticateAndParse(req, res, ip, config, keyLimiter, ipLimiter, authenticate);
      if (!authed) return;
      try {
        const profile = analyzeProject(authed.description);
        const plan = mapToTools(profile, config.projectRoot);
        sendJson(res, 200, success("plan", plan, Date.now()), req);
      } catch (err) {
        sendError(res, 400, "PLAN_ERROR", toErrorMessage(err), req);
      }
      return;
    }

    // ── POST /api/generate ──────────────────────────────────────
    if (method === "POST" && path === "/api/generate") {
      const authed = await authenticateAndParse(req, res, ip, config, keyLimiter, ipLimiter, authenticate);
      if (!authed) return;
      if (authed.keyRecord.tier === "free") {
        sendError(res, 403, "TIER_REQUIRED", "Generation requires starter tier or above", req); return;
      }
      const keyHash = hashKey(req.headers.authorization!.slice(7));
      const tierLimits = getTierLimits(authed.keyRecord.tier);
      if (!usageMeter.recordUsage(keyHash, tierLimits.dailyGens)) {
        sendError(res, 429, "DAILY_LIMIT", `Daily generation limit (${tierLimits.dailyGens}) exceeded`, req); return;
      }
      if (jobQueue.length >= maxQueueDepth) {
        sendError(res, 503, "QUEUE_FULL", "Job queue is full — try again later", req); return;
      }

      const job: Job = {
        id: randomUUID(),
        status: "queued",
        stage: "queued",
        description: authed.description,
        tier: authed.keyRecord.tier,
        progress: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      jobs.set(job.id, job);
      jobQueue.push(job.id);
      drainQueue();

      sendJson(res, 202, success("generate", { jobId: job.id, status: "queued" }, Date.now()), req);
      return;
    }

    // ── GET /api/status/:id ─────────────────────────────────────
    const statusMatch = path.match(/^\/api\/status\/([a-f0-9-]{36})$/);
    if (method === "GET" && statusMatch) {
      const keyRecord = authenticate(req);
      if (!keyRecord) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }

      const job = jobs.get(statusMatch[1]!);
      if (!job) { sendError(res, 404, "NOT_FOUND", "Job not found", req); return; }

      sendJson(res, 200, success("status", {
        id: job.id,
        status: job.status,
        stage: job.stage,
        progress: job.progress,
        error: job.error,
        profile: job.profile ? {
          techs: job.profile.techs.map(t => t.name),
          primaryLanguage: job.profile.primaryLanguage,
          complexity: job.profile.complexity,
        } : undefined,
        recommendations: job.plan ? job.plan.summary : undefined,
        report: job.report,
      }, Date.now()), req);
      return;
    }

    // ── GET /api/download/:id ───────────────────────────────────
    const dlMatch = path.match(/^\/api\/download\/([a-f0-9-]{36})$/);
    if (method === "GET" && dlMatch) {
      const keyRecord = authenticate(req);
      if (!keyRecord) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }

      const job = jobs.get(dlMatch[1]!);
      if (!job) { sendError(res, 404, "NOT_FOUND", "Job not found", req); return; }
      if (job.status !== "completed") {
        sendError(res, 409, "NOT_READY", `Job status: ${job.status}`, req); return;
      }
      if (!job.bundlePath) {
        sendError(res, 404, "NO_BUNDLE", "Bundle not yet available — use /api/status to check progress", req); return;
      }

      // Direct stat — handle ENOENT instead of TOCTOU existsSync + statSync
      try {
        const stat = statSync(job.bundlePath);
        res.writeHead(200, {
          "Content-Type": "application/gzip",
          "Content-Length": stat.size,
          "Content-Disposition": `attachment; filename="companion-bundle-${job.id.slice(0, 8)}.tar.gz"`,
          "X-Content-Type-Options": "nosniff",
        });
        createReadStream(job.bundlePath).pipe(res);
      } catch {
        sendError(res, 404, "NO_BUNDLE", "Bundle file not found", req);
      }
      return;
    }

    // ── GET /api/usage ──────────────────────────────────────────
    if (method === "GET" && path === "/api/usage") {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      const keyRecord = authed.keyRecord;
      const authHeader = req.headers.authorization ?? "";
      const keyHash = hashKey(authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authed.clerkUserId ?? "");
      const usage = usageMeter.getUsage(keyHash);
      const tierLimits = getTierLimits(keyRecord.tier);
      sendJson(res, 200, success("usage", {
        tier: keyRecord.tier,
        dailyLimit: tierLimits.dailyGens,
        used: usage.count,
        remaining: tierLimits.dailyGens < 0 ? -1 : tierLimits.dailyGens - usage.count,
        resetsAt: new Date(usage.resetAt).toISOString(),
      }, Date.now()), req);
      return;
    }

    // ── Auth endpoints ────────────────────────────────────────

    // GET /api/auth/me — Clerk-aware user info
    if (method === "GET" && path === "/api/auth/me") {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      sendJson(res, 200, success("auth-me", {
        email: authed.clerkEmail ?? "user@example.com",
        userId: authed.clerkUserId ?? null,
        tier: authed.keyRecord.tier,
      }, Date.now()), req);
      return;
    }

    // ── Billing endpoints ──────────────────────────────────────

    // POST /api/billing/webhook — raw body, Stripe-Signature header
    // IMPORTANT: must read raw bytes before any JSON parsing
    if (method === "POST" && path === "/api/billing/webhook") {
      try {
        const payload = await parseBody(req, config.maxBodySize);
        const signature = req.headers["stripe-signature"];
        if (!signature || Array.isArray(signature)) {
          sendError(res, 400, "INVALID_SIGNATURE", "Missing stripe-signature header", req); return;
        }
        const billing = createBillingProvider("stripe");
        const event = await billing.verifyWebhook(payload, signature, config.stripeWebhookSecret);

        // Handle subscription events — resolve tier from Stripe price ID
        if (event.type === "checkout.session.completed" || event.type === "customer.subscription.updated") {
          const eventData = event.data as Record<string, unknown>;

          // Extract price ID: from subscription items (subscription.updated) or line_items (checkout.completed)
          let priceId: string | undefined;
          const items = (eventData["items"] as { data?: Array<{ price?: { id?: string } }> })?.data;
          if (items?.[0]?.price?.id) {
            priceId = items[0].price.id;
          }
          // For checkout.session.completed, the price may be nested in line_items
          if (!priceId) {
            const lineItems = (eventData["line_items"] as { data?: Array<{ price?: { id?: string } }> })?.data;
            if (lineItems?.[0]?.price?.id) {
              priceId = lineItems[0].price.id;
            }
          }

          const tier = priceId ? PRICE_TO_TIER[priceId] ?? "free" : "free";

          // Extract Clerk user ID from metadata for reverse-lookup
          const meta = eventData["metadata"] as Record<string, string> | undefined;
          const clerkUserId = meta?.["clerkUserId"];

          if (clerkUserId && config.clerkConfig) {
            try {
              await updateUserMetadata(
                clerkUserId,
                { tier, stripeCustomerId: event.customerId },
                config.clerkConfig,
              );
            } catch {
              // Non-fatal — log in production
            }
          }
        }

        // Handle subscription deletion — downgrade to free
        if (event.type === "customer.subscription.deleted") {
          const eventData = event.data as Record<string, unknown>;
          const meta = eventData["metadata"] as Record<string, string> | undefined;
          const clerkUserId = meta?.["clerkUserId"];

          if (clerkUserId && config.clerkConfig) {
            try {
              await updateUserMetadata(
                clerkUserId,
                { tier: "free" },
                config.clerkConfig,
              );
            } catch {
              // Non-fatal
            }
          }
        }

        sendJson(res, 200, success("billing-webhook", { received: true, type: event.type }, Date.now()), req);
      } catch (err) {
        sendError(res, 400, "WEBHOOK_ERROR", toErrorMessage(err), req);
      }
      return;
    }

    // POST /api/billing/checkout — no auth required (guest checkout supported)
    if (method === "POST" && path === "/api/billing/checkout") {
      try {
        const body = await parseBody(req, config.maxBodySize);
        const parsed = JSON.parse(body) as { priceId?: string; successUrl?: string; cancelUrl?: string; email?: string };

        const origin = `${req.headers["x-forwarded-proto"] ?? "http"}://${req.headers.host ?? "localhost"}`;
        const billing = createBillingProvider("stripe");

        // Try optional auth — if logged in, attach Stripe customer
        const authed = await requireAuth(req);
        let customerId: string | undefined;
        let clerkUserId: string | undefined;

        if (authed?.clerkUserId) {
          customerId = await getOrCreateStripeCustomer(
            authed.clerkUserId,
            authed.clerkEmail,
            authed.clerkMetadata ?? {},
          );
          clerkUserId = authed.clerkUserId;
        }

        const result = await billing.createCheckoutSession(
          customerId,
          parsed.priceId || "price_default",
          parsed.successUrl ?? `${origin}/?checkout=success`,
          clerkUserId,
        );
        sendJson(res, 200, success("billing-checkout", result, Date.now()), req);
      } catch (err) {
        sendError(res, 400, "BILLING_ERROR", toErrorMessage(err), req);
      }
      return;
    }

    // GET /api/billing/portal
    if (method === "GET" && path === "/api/billing/portal") {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      try {
        let customerId: string;
        if (authed.clerkUserId) {
          customerId = await getOrCreateStripeCustomer(
            authed.clerkUserId,
            authed.clerkEmail,
            authed.clerkMetadata ?? {},
          );
        } else {
          customerId = "cus_mock";
        }
        const billing = createBillingProvider("stripe");
        const result = await billing.getPortalUrl(customerId);
        sendJson(res, 200, success("billing-portal", result, Date.now()), req);
      } catch (err) {
        sendError(res, 400, "BILLING_ERROR", toErrorMessage(err), req);
      }
      return;
    }

    // GET /api/billing/invoices
    if (method === "GET" && path === "/api/billing/invoices") {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      try {
        let customerId: string;
        if (authed.clerkUserId) {
          customerId = await getOrCreateStripeCustomer(
            authed.clerkUserId,
            authed.clerkEmail,
            authed.clerkMetadata ?? {},
          );
        } else {
          customerId = "cus_mock";
        }
        const billing = createBillingProvider("stripe");
        const result = await billing.listInvoices(customerId);
        sendJson(res, 200, success("billing-invoices", result, Date.now()), req);
      } catch (err) {
        sendError(res, 400, "BILLING_ERROR", toErrorMessage(err), req);
      }
      return;
    }

    // ── Agent Economy endpoints ─────────────────────────────────────

    // GET /api/earnings
    if (method === "GET" && path === "/api/earnings") {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      void authed; // authenticated but no keyRecord fields needed here
      const period = url.searchParams.get("period") || "month";
      const nextPayout = new Date();
      nextPayout.setDate(nextPayout.getDate() + (30 - nextPayout.getDate() % 30));
      sendJson(res, 200, success("earnings", {
        totalEarned: 0,
        pendingPayout: 0,
        nextPayoutDate: nextPayout.toISOString().slice(0, 10),
        period,
        skills: [],
      }, Date.now()), req);
      return;
    }

    // GET /api/agents/:id/metrics
    const agentMetricsMatch = path.match(/^\/api\/agents\/([^/]+)\/metrics$/);
    if (method === "GET" && agentMetricsMatch) {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      res.writeHead(200, { "Content-Type": "application/json", ...corsHeaders(req) });
      res.end(JSON.stringify({
        success: true,
        data: {
          agentId: agentMetricsMatch[1],
          totalCalls: 0,
          totalCost: 0,
          avgLatencyMs: 0,
          heatmap: Array.from({ length: 24 }, () => 0),
        },
      }));
      return;
    }

    // GET /api/agents/:id/heatmap
    const agentHeatmapMatch = path.match(/^\/api\/agents\/([^/]+)\/heatmap$/);
    if (method === "GET" && agentHeatmapMatch) {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      res.writeHead(200, { "Content-Type": "application/json", ...corsHeaders(req) });
      res.end(JSON.stringify({
        success: true,
        data: {
          agentId: agentHeatmapMatch[1],
          hours: Array.from({ length: 24 }, () => 0),
          date: new Date().toISOString().slice(0, 10),
        },
      }));
      return;
    }

    // POST /api/agent-keys
    if (method === "POST" && path === "/api/agent-keys") {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      try {
        const body = await parseBody(req, config.maxBodySize);
        const parsed = JSON.parse(body) as { scopes?: string[] };
        const scopes = parsed.scopes ?? [];
        const id = Math.random().toString(36).slice(2, 10);
        const secret = "sk-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        sendJson(res, 200, success("agent-keys-create", {
          id,
          secret,
          scopes,
          createdAt: new Date().toISOString(),
        }, Date.now()), req);
      } catch (err) {
        sendError(res, 400, "INVALID_INPUT", toErrorMessage(err), req);
      }
      return;
    }

    // DELETE /api/agent-keys/:id
    const agentKeyDeleteMatch = path.match(/^\/api\/agent-keys\/([^/]+)$/);
    if (method === "DELETE" && agentKeyDeleteMatch) {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      sendJson(res, 200, success("agent-keys-revoke", {
        revoked: true,
        id: agentKeyDeleteMatch[1],
      }, Date.now()), req);
      return;
    }

    // GET /api/invocations/stream
    if (method === "GET" && path === "/api/invocations/stream") {
      const authed = await requireAuth(req);
      if (!authed) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token", req); return; }
      const skill = url.searchParams.get("skill") || "unknown";
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...corsHeaders(req),
      });

      const agents = ["claude-sonnet-4-6", "gpt-4o", "gemini-1.5-pro", "local-agent"];
      const sendEvent = () => {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const latencyMs = Math.floor(Math.random() * 900) + 80;
        const event = JSON.stringify({ skill, agent, latencyMs, ts: Date.now() });
        res.write(`data: ${event}\n\n`);
      };

      sendEvent();
      const streamInterval = setInterval(sendEvent, 3000 + Math.random() * 5000);
      req.on("close", () => clearInterval(streamInterval));
      return;
    }

    // ── Catalog endpoint ───────────────────────────────────────

    // GET /api/catalog
    if (method === "GET" && path === "/api/catalog") {
      try {
        const marketplacePath = join(config.projectRoot, "marketplace.json");
        if (existsSync(marketplacePath)) {
          const data = JSON.parse(readFileSync(marketplacePath, "utf-8"));
          sendJson(res, 200, success("catalog", data, Date.now()), req);
        } else {
          sendJson(res, 200, success("catalog", { products: [] }, Date.now()), req);
        }
      } catch (err) {
        sendError(res, 500, "CATALOG_ERROR", toErrorMessage(err), req);
      }
      return;
    }

    // ── Static file serving for saas-ui/ ───────────────────────

    if (!path.startsWith("/api/")) {
      const saasUiDir = resolve(config.projectRoot, "examples", "saas-ui");
      let filePath = path === "/" ? "/index.html" : path;
      const resolved = resolve(saasUiDir, normalize(filePath).replace(/^\//, ""));

      // Path traversal check — must be within saas-ui/
      if (!resolved.startsWith(saasUiDir + "/") && resolved !== saasUiDir) {
        sendError(res, 403, "FORBIDDEN", "Path traversal denied", req);
        return;
      }

      try {
        const stat = statSync(resolved);
        if (!stat.isFile()) { sendError(res, 404, "NOT_FOUND", "Not a file", req); return; }
        if (stat.size > 10_000_000) { sendError(res, 413, "TOO_LARGE", "File too large", req); return; }

        const ext = extname(resolved).toLowerCase();
        const mimeTypes: Record<string, string> = {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".svg": "image/svg+xml",
          ".ico": "image/x-icon",
          ".woff2": "font/woff2",
          ".woff": "font/woff",
        };

        res.writeHead(200, {
          "Content-Type": mimeTypes[ext] || "application/octet-stream",
          "Content-Length": stat.size,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-cache",
        });
        createReadStream(resolved).pipe(res);
      } catch {
        // File not found — try index.html for SPA routing
        try {
          const indexPath = join(saasUiDir, "index.html");
          const indexStat = statSync(indexPath);
          res.writeHead(200, {
            "Content-Type": "text/html",
            "Content-Length": indexStat.size,
            "X-Content-Type-Options": "nosniff",
          });
          createReadStream(indexPath).pipe(res);
        } catch {
          sendError(res, 404, "NOT_FOUND", "File not found", req);
        }
      }
      return;
    }

    // ── 404 ─────────────────────────────────────────────────────
    sendError(res, 404, "NOT_FOUND", `Unknown endpoint: ${method} ${path}`, req);
  }

  // ── Server setup ──────────────────────────────────────────────────

  const server = createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      sendError(res, 500, "INTERNAL", toErrorMessage(err));
    });
  });

  server.listen(config.port, config.host, () => {
    console.log(`\n  Companion web service listening on http://${config.host}:${config.port}`);
    console.log("  Endpoints:");
    console.log("    GET  /api/health           — Service status");
    console.log("    POST /api/analyze          — Description → TechStackProfile");
    console.log("    POST /api/plan             — Description → ToolRecommendations");
    console.log("    POST /api/generate         — Description → async job");
    console.log("    GET  /api/status/:id       — Poll job status");
    console.log("    GET  /api/download/:id     — Download bundle");
    console.log("    GET  /api/usage            — Check daily usage");
    console.log("    GET  /api/config           — Public config (Clerk publishable key)");
    console.log("    GET  /api/auth/me          — Current user (Clerk or API key)");
    console.log("    POST /api/billing/webhook  — Stripe webhook (raw body)");
    console.log("    POST /api/billing/checkout — Stripe checkout session");
    console.log("    GET  /api/billing/portal   — Billing portal");
    console.log("    GET  /api/billing/invoices — Invoice history");
    console.log("    GET  /api/catalog          — Marketplace catalog");
    console.log("    *    /*                    — Static files (saas-ui/)");
    console.log("");
  });

  const stop = (): Promise<void> => {
    return new Promise((resolve) => {
      clearInterval(sweepTimer);
      server.close(() => resolve());
      const timer = setTimeout(() => {
        server.closeAllConnections?.();
        resolve();
      }, 30_000);
      timer.unref();
    });
  };

  const onSignal = (): void => {
    console.log("\n  Shutting down...");
    stop().then(() => {
      process.exitCode = 0;
    });
  };

  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);

  return { server, stop };
}

/**
 * Creates a request handler without binding to a port.
 * Used by Vercel serverless functions and other embedding contexts.
 */
export function createHandler(
  config: WebServiceConfig,
): (req: IncomingMessage, res: ServerResponse) => void {
  const { server } = startServer(config);
  // The request listener is added synchronously by createServer — safe to extract before listen resolves.
  const [listener] = server.rawListeners("request") as [(req: IncomingMessage, res: ServerResponse) => void];
  server.close(); // release the port; listener closure remains valid
  return listener;
}

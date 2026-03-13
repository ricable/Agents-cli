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
import { createReadStream, statSync } from "node:fs";
import { success, failure, toErrorMessage } from "../output.js";
import { analyzeProject } from "./analyzer.js";
import { mapToTools } from "./mapper.js";
import type { TechStackProfile } from "./analyzer.js";
import type { CompanionToolPlan } from "./mapper.js";
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
}

type JobStatus = "queued" | "running" | "completed" | "failed";

interface Job {
  id: string;
  status: JobStatus;
  description: string;
  profile?: TechStackProfile;
  plan?: CompanionToolPlan;
  progress: number;
  error?: string;
  bundlePath?: string;
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

// ── Response Helpers ───────────────────────────────────────────────────

function sendJson<T>(res: ServerResponse, status: number, data: CliOutput<T>): void {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(body);
}

function sendError(res: ServerResponse, status: number, code: string, message: string): void {
  sendJson(res, status, failure("web-service", code, message, Date.now()));
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
  if (!keyRecord) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token"); return null; }
  if (!keyLimiter.consume(hashKey(req.headers.authorization!.slice(7)))) {
    sendError(res, 429, "RATE_LIMITED", "Rate limit exceeded for API key"); return null;
  }
  if (!ipLimiter.consume(ip)) {
    sendError(res, 429, "RATE_LIMITED", "Rate limit exceeded for IP"); return null;
  }

  const body = await parseBody(req, config.maxBodySize);
  const parsed = JSON.parse(body) as { description?: string };
  if (!parsed.description || typeof parsed.description !== "string") {
    sendError(res, 400, "INVALID_INPUT", "Missing 'description' field"); return null;
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

  function authenticate(req: IncomingMessage): ApiKeyRecord | null {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    return config.apiKeys.get(hashKey(token)) ?? null;
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
      job.progress = 10;
      job.profile = analyzeProject(job.description);
      job.updatedAt = Date.now();

      job.progress = 30;
      job.plan = mapToTools(job.profile, config.projectRoot);
      job.updatedAt = Date.now();

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
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      });
      res.end();
      return;
    }

    const ip = getClientIp(req);

    // ── GET /api/health ─────────────────────────────────────────
    if (method === "GET" && path === "/api/health") {
      sendJson(res, 200, success("health", {
        status: "ok",
        uptime: Date.now() - serverStartTime,
        activeJobs: runningJobs,
        queuedJobs: jobQueue.length,
        totalJobs: jobs.size,
      }, Date.now()));
      return;
    }

    // ── POST /api/analyze ───────────────────────────────────────
    if (method === "POST" && path === "/api/analyze") {
      const authed = await authenticateAndParse(req, res, ip, config, keyLimiter, ipLimiter, authenticate);
      if (!authed) return;
      try {
        const profile = analyzeProject(authed.description);
        sendJson(res, 200, success("analyze", profile, Date.now()));
      } catch (err) {
        sendError(res, 400, "ANALYSIS_ERROR", toErrorMessage(err));
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
        sendJson(res, 200, success("plan", plan, Date.now()));
      } catch (err) {
        sendError(res, 400, "PLAN_ERROR", toErrorMessage(err));
      }
      return;
    }

    // ── POST /api/generate ──────────────────────────────────────
    if (method === "POST" && path === "/api/generate") {
      const authed = await authenticateAndParse(req, res, ip, config, keyLimiter, ipLimiter, authenticate);
      if (!authed) return;
      if (authed.keyRecord.tier === "free") {
        sendError(res, 403, "TIER_REQUIRED", "Generation requires starter tier or above"); return;
      }
      if (jobQueue.length >= maxQueueDepth) {
        sendError(res, 503, "QUEUE_FULL", "Job queue is full — try again later"); return;
      }

      const job: Job = {
        id: randomUUID(),
        status: "queued",
        description: authed.description,
        progress: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      jobs.set(job.id, job);
      jobQueue.push(job.id);
      drainQueue();

      sendJson(res, 202, success("generate", { jobId: job.id, status: "queued" }, Date.now()));
      return;
    }

    // ── GET /api/status/:id ─────────────────────────────────────
    const statusMatch = path.match(/^\/api\/status\/([a-f0-9-]{36})$/);
    if (method === "GET" && statusMatch) {
      const keyRecord = authenticate(req);
      if (!keyRecord) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token"); return; }

      const job = jobs.get(statusMatch[1]!);
      if (!job) { sendError(res, 404, "NOT_FOUND", "Job not found"); return; }

      sendJson(res, 200, success("status", {
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        profile: job.profile ? {
          techs: job.profile.techs.map(t => t.name),
          primaryLanguage: job.profile.primaryLanguage,
          complexity: job.profile.complexity,
        } : undefined,
        recommendations: job.plan ? job.plan.summary : undefined,
      }, Date.now()));
      return;
    }

    // ── GET /api/download/:id ───────────────────────────────────
    const dlMatch = path.match(/^\/api\/download\/([a-f0-9-]{36})$/);
    if (method === "GET" && dlMatch) {
      const keyRecord = authenticate(req);
      if (!keyRecord) { sendError(res, 401, "UNAUTHORIZED", "Missing or invalid Bearer token"); return; }

      const job = jobs.get(dlMatch[1]!);
      if (!job) { sendError(res, 404, "NOT_FOUND", "Job not found"); return; }
      if (job.status !== "completed") {
        sendError(res, 409, "NOT_READY", `Job status: ${job.status}`); return;
      }
      if (!job.bundlePath) {
        sendError(res, 404, "NO_BUNDLE", "Bundle not yet available — use /api/status to check progress"); return;
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
        sendError(res, 404, "NO_BUNDLE", "Bundle file not found");
      }
      return;
    }

    // ── 404 ─────────────────────────────────────────────────────
    sendError(res, 404, "NOT_FOUND", `Unknown endpoint: ${method} ${path}`);
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
    console.log("    GET  /api/health          — Service status");
    console.log("    POST /api/analyze          — Description → TechStackProfile");
    console.log("    POST /api/plan             — Description → ToolRecommendations");
    console.log("    POST /api/generate         — Description → async job");
    console.log("    GET  /api/status/:id       — Poll job status");
    console.log("    GET  /api/download/:id     — Download bundle");
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

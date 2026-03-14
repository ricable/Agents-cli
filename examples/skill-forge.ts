#!/usr/bin/env npx tsx
/**
 * skill-forge.ts — Unified skill generation pipeline (dispatcher)
 *
 * This is the CLI entry point. Mode-specific logic lives in forge/*.ts modules.
 *
 * Modes:
 *   --full-pipeline           Full end-to-end: generate → skills → plugins → marketplace
 *   --cli-anything <app>      Generate agent-native harness for an app
 *   --cli-anything-batch      Batch generate all registered apps
 *   --orchestrate             Run recipe with agent teams
 *   --tool <source>           Direct tool → skill generation
 *   "prompt text"             NL discovery → multi-registry search → skills
 *   --trending                GitHub trending → CLI filter → skills
 *   --curated                 Curated registry → skills
 *   --workflow "prompt"       NL prompt → agent code from templates
 *   --audit                   Quality audit of existing skills
 *   --search <query>          Search indexed skills (FTS/hybrid/vector)
 *   --index                   Rebuild search index
 *   --plugin                  Build domain plugins
 *   --agent-defs              Generate agent definitions
 *   --marketplace             Generate marketplace catalog (v1)
 *   --marketplace-v2          Bundle + catalog + pricing (v2)
 *   --freeze / --verify       Lockfile ops
 *   --companion --serve       Start web service
 *   --mcp                     Start MCP server exposing skills
 *
 * Common flags:
 *   --deep, --dry-run, --json, --strict, --force, --no-cache
 *   --limit N, --domain X, --ai, --factory, --monorepo
 *   --search-mode fts|hybrid|vector, --pkg <name>
 *
 * Usage:
 *   npx tsx examples/skill-forge.ts --full-pipeline --dry-run --limit 3
 *   npx tsx examples/skill-forge.ts --cli-anything ffmpeg
 *   npx tsx examples/skill-forge.ts --tool pypi:ruff --deep
 *   npx tsx examples/skill-forge.ts --orchestrate --recipe creative-suite
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { setQuiet } from "./forge/helpers.js";
import { failure, emit, toErrorMessage } from "../lib/output.js";

// ── Load .env from project root (before anything else) ────────────────
(function loadDotEnv() {
  const envPath = resolve(import.meta.dirname ?? process.cwd(), "../.env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes (single or double)
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && val && !(key in process.env)) {
      process.env[key] = val;
    }
  }
})();

// Re-export for backward compatibility with tests
export { parseArgs } from "./forge/parse-args.js";
export { fmtTable, toolToManifestEntry, inferDomainFromTool } from "./forge/helpers.js";

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();
  const { parseArgs } = await import("./forge/parse-args.js");
  const args = parseArgs();
  setQuiet(args.json);

  const { log } = await import("./forge/helpers.js");

  log("");
  log("  ╔═══════════════════════════════════════════════════════╗");
  log("  ║           skill-forge — Unified Skill Pipeline        ║");
  log("  ╚═══════════════════════════════════════════════════════╝");
  log("");

  // ── Mode dispatch ──

  if (args.search) {
    const { searchMode } = await import("./forge/mode-search.js");
    await searchMode(args, startTime);
    return;
  }

  if (args.index) {
    const { indexMode } = await import("./forge/mode-index.js");
    await indexMode(args, startTime);
    return;
  }

  if (args.freeze) {
    const { freezeMode } = await import("./forge/mode-lockfile.js");
    freezeMode(args, startTime);
    return;
  }

  if (args.verify) {
    const { verifyMode } = await import("./forge/mode-lockfile.js");
    verifyMode(args, startTime);
    return;
  }

  if (args.mcp) {
    const { mcpMode } = await import("./forge/mode-mcp.js");
    await mcpMode(args, startTime);
    return;
  }

  if (args.plugin) {
    const { pluginMode } = await import("./forge/mode-plugin.js");
    await pluginMode(args, startTime);
    return;
  }

  if (args.agentDefs) {
    const { agentDefsMode } = await import("./forge/mode-plugin.js");
    await agentDefsMode(args, startTime);
    return;
  }

  if (args.marketplaceV2) {
    const { marketplaceV2Mode } = await import("./forge/mode-marketplace-v2.js");
    await marketplaceV2Mode(args, startTime);
    return;
  }

  if (args.marketplace) {
    const { marketplaceMode } = await import("./forge/mode-plugin.js");
    await marketplaceMode(args, startTime);
    return;
  }

  if (args.system) {
    const { systemMode } = await import("./forge/mode-system.js");
    await systemMode(args, startTime);
    return;
  }

  if (args.trending) {
    const { trendingMode } = await import("./forge/mode-trending.js");
    await trendingMode(args, startTime);
    return;
  }

  if (args.curated || args.listCategories) {
    const { curatedMode } = await import("./forge/mode-curated.js");
    await curatedMode(args, startTime);
    return;
  }

  if (args.workflow) {
    const { workflowMode } = await import("./forge/mode-workflow.js");
    await workflowMode(args, startTime);
    return;
  }

  if (args.companion && args.serve) {
    const { startServer } = await import("../lib/companion/web-service.js");
    const { createHash } = await import("node:crypto");
    const testKeyHash = createHash("sha256").update("test-key").digest("hex");

    const clerkPublishableKey = process.env["CLERK_PUBLISHABLE_KEY"];
    const clerkSecretKey = process.env["CLERK_SECRET_KEY"];
    const stripeWebhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

    if (clerkSecretKey) {
      console.log("  Clerk auth enabled");
    } else {
      console.log("  WARNING: CLERK_SECRET_KEY not set — auth in mock mode");
    }

    startServer({
      port: args.port,
      host: "127.0.0.1",
      apiKeys: new Map([[testKeyHash, { tier: "starter" as const, label: "test" }]]),
      maxConcurrentJobs: 3,
      jobTtlMs: 3_600_000,
      rateLimitPerKey: 60,
      rateLimitPerIp: 30,
      maxBodySize: 1_048_576,
      projectRoot: process.cwd(),
      outputDir: "examples/generated-skills",
      clerkConfig: clerkSecretKey
        ? { secretKey: clerkSecretKey, publishableKey: clerkPublishableKey }
        : undefined,
      stripeWebhookSecret,
    });
    return;
  }

  if (args.companion) {
    const { companionMode } = await import("./forge/mode-companion.js");
    await companionMode(args, startTime);
    return;
  }

  if (args.auditPlugins) {
    const { runAuditPluginsMode } = await import("./forge/mode-audit-plugins.js");
    await runAuditPluginsMode(args);
    return;
  }

  if (args.benchmark) {
    const { runBenchmarkMode } = await import("./forge/mode-benchmark.js");
    await runBenchmarkMode(args);
    return;
  }

  if (args.fullPipeline) {
    const { fullPipelineMode } = await import("./forge/mode-full-pipeline.js");
    await fullPipelineMode(args, startTime);
    return;
  }

  if (args.cliAnything || args.cliAnythingBatch) {
    const { cliAnythingMode } = await import("./forge/mode-cli-anything.js");
    await cliAnythingMode(args, startTime);
    return;
  }

  if (args.orchestrate) {
    const { orchestrateMode } = await import("./forge/mode-orchestrate.js");
    await orchestrateMode(args, startTime);
    return;
  }

  if (args.audit) {
    const { auditMode } = await import("./forge/mode-audit.js");
    await auditMode(args, startTime);
    return;
  }

  if (args.tool) {
    const { toolMode } = await import("./forge/mode-tool.js");
    await toolMode(args, startTime);
    return;
  }

  // ── Discovery from NL prompt ──

  if (args.prompt) {
    const { discoveryMode } = await import("./forge/mode-discovery.js");
    await discoveryMode(args, startTime);
    return;
  }

  // ── Usage ──
  log("  Usage:");
  log("");
  log("  Generation:");
  log("    --cli-anything <app>       Generate harness for a single app");
  log("    --cli-anything-batch       Batch generate all registered apps");
  log("    --full-pipeline            Full end-to-end: generate → skills → plugins → marketplace");
  log("    --refine                   Gap analysis on existing harness");
  log("");
  log("  Orchestration:");
  log("    --orchestrate              Run recipe with agent teams");
  log("    --recipe <name>            Recipe: creative-suite, office-suite, devops-kit");
  log("");
  log("  Skills & Tools:");
  log("    --tool <source>            Generate skill from tool");
  log('    "prompt text"              NL discovery → skills');
  log("    --trending                 GitHub trending → skills");
  log("    --curated                  Curated registry → skills");
  log('    --workflow "prompt"         NL prompt → agent code from templates');
  log("");
  log("  Plugins & Marketplace:");
  log("    --plugin                   Build domain plugins");
  log("    --agent-defs               Generate agent definitions");
  log("    --marketplace              Generate marketplace (v1)");
  log("    --marketplace-v2           Bundle + catalog (v2)");
  log("");
  log("  Quality & Search:");
  log("    --audit                    Quality audit of skills");
  log('    --search <query>           Search indexed skills');
  log("    --index                    Rebuild search index");
  log("");
  log("  Infrastructure:");
  log("    --freeze / --verify        Lockfile ops");
  log("    --system                   System PATH discovery");
  log("    --companion --serve        Start web service");
  log("    --mcp                      Start MCP server");
  log("");
  log("  Common flags:");
  log("    --deep --dry-run --json --force --limit N --domain X --ai");
  log("");
}

main().catch((err) => {
  const message = toErrorMessage(err);
  if (process.argv.includes("--json")) {
    emit(failure("skill-forge", "FATAL", message, Date.now()), true);
  } else {
    console.error(`\nFatal: ${message}`);
  }
  process.exitCode = 1;
});

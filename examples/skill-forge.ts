#!/usr/bin/env npx tsx
/**
 * skill-forge.ts — Unified skill generation pipeline (dispatcher)
 *
 * This is the CLI entry point. Mode-specific logic lives in forge/*.ts modules.
 *
 * Modes:
 *   --tool <source>          Direct tool → skill generation
 *   "prompt text"            NL discovery → multi-registry search → skills
 *   --trending               GitHub trending → CLI filter → skills
 *   --curated                Curated registry → skills
 *   --workflow "prompt"      NL prompt → agent code from templates
 *   --audit                  Quality audit of existing skills
 *   --search <query>         Search indexed skills (FTS/hybrid/vector)
 *   --index                  Rebuild search index
 *   --plugin                 Build domain plugins
 *   --agent-defs             Generate agent definitions
 *   --marketplace            Generate marketplace catalog
 *   --freeze                 Generate lockfile from skills
 *   --verify                 Verify lockfile integrity
 *   --mcp                    Start MCP server exposing skills
 *
 * Common flags:
 *   --deep, --dry-run, --json, --strict, --force, --no-cache
 *   --limit N, --domain X, --ai, --factory, --monorepo
 *   --search-mode fts|hybrid|vector, --pkg <name>
 *   --skill-output (workflow mode)
 *
 * Usage:
 *   npx tsx examples/skill-forge.ts "build a RAG pipeline with vector search"
 *   npx tsx examples/skill-forge.ts --tool pypi:ruff --deep
 *   npx tsx examples/skill-forge.ts --search "python linting"
 *   npx tsx examples/skill-forge.ts --index
 *   npx tsx examples/skill-forge.ts --plugin --dry-run
 *   npx tsx examples/skill-forge.ts --freeze && npx tsx examples/skill-forge.ts --verify
 */

import { setQuiet } from "./forge/helpers.js";
import { failure, emit, toErrorMessage } from "../lib/output.js";

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
    workflowMode(args, startTime);
    return;
  }

  if (args.companion && args.serve) {
    const { startServer } = await import("../lib/companion/web-service.js");
    const { createHash } = await import("node:crypto");
    const testKeyHash = createHash("sha256").update("test-key").digest("hex");
    console.log("  WARNING: Using test API key — not for production use");
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
  log('    npx tsx examples/skill-forge.ts "build a RAG pipeline"');
  log("    npx tsx examples/skill-forge.ts --tool ruff --deep");
  log("    npx tsx examples/skill-forge.ts --audit [--domain X] [--ai]");
  log("    npx tsx examples/skill-forge.ts --trending [--language rust] [--since weekly]");
  log("    npx tsx examples/skill-forge.ts --curated [--category ai-ml] [--skip-installed]");
  log('    npx tsx examples/skill-forge.ts --workflow "build a code review council"');
  log("    npx tsx examples/skill-forge.ts --workflow --list");
  log('    npx tsx examples/skill-forge.ts --search "python linting"');
  log("    npx tsx examples/skill-forge.ts --index [--domain X]");
  log("    npx tsx examples/skill-forge.ts --plugin [--domain X] [--dry-run]");
  log("    npx tsx examples/skill-forge.ts --agent-defs [--domain X] [--ai]");
  log("    npx tsx examples/skill-forge.ts --freeze");
  log("    npx tsx examples/skill-forge.ts --verify");
  log("    npx tsx examples/skill-forge.ts --system [--limit 20] [--dry-run]");
  log('    npx tsx examples/skill-forge.ts --companion "FastAPI + PostgreSQL + React" [--dry-run]');
  log("    npx tsx examples/skill-forge.ts --companion --serve [--port 3100]");
  log("    npx tsx examples/skill-forge.ts --mcp");
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

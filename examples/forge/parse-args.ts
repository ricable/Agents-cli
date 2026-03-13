/**
 * forge/parse-args.ts — CLI argument parsing for skill-forge.
 */

import type { CliArgs } from "./types.js";

export function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const opts: CliArgs = {
    prompt: "", tool: "", deep: false, audit: false,
    dryRun: false, limit: 10, json: false, strict: false, force: false,
    trending: false, language: "", since: "monthly",
    curated: false, category: "", listCategories: false, skipInstalled: false,
    workflow: false, out: "", list: false,
    ai: false, domain: "",
    noCache: false,
    factory: false, skillOutput: false,
    monorepo: false,
    search: "", searchMode: "fts", pkg: "",
    index: false,
    plugin: false, agentDefs: false, marketplace: false,
    freeze: false, verify: false,
    mcp: false,
    system: false,
    timeout: 300000,
    concurrency: 1,
    resume: "",
    noIndex: false,
    // Phase 1: Full ecosystem integration
    full: false,
    multiRuntime: false,
    outputDir: "",
    batchSize: 20,
    // Phase 2: Audit plugins
    auditPlugins: false,
    benchmark: false,
    // Companion mode
    companion: false,
    serve: false,
    port: 3100,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--tool" && argv[i + 1])        { opts.tool = argv[++i]!; }
    else if (a === "--deep")                  { opts.deep = true; }
    else if (a === "--audit")                 { opts.audit = true; }
    else if (a === "--dry-run")               { opts.dryRun = true; }
    else if (a === "--force")                 { opts.force = true; }
    else if (a === "--limit" && argv[i+1])    {
      const parsed = parseInt(argv[++i]!, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        throw new Error(`Invalid --limit value: "${argv[i]}" (must be a positive integer)`);
      }
      opts.limit = parsed;
    }
    else if (a === "--json")                  { opts.json = true; }
    else if (a === "--strict")                { opts.strict = true; }
    // Trending mode
    else if (a === "--trending")              { opts.trending = true; }
    else if (a === "--language" && argv[i+1]) { opts.language = argv[++i]!; }
    else if (a === "--since" && argv[i+1])    { opts.since = argv[++i]!; }
    // Curated mode
    else if (a === "--curated")               { opts.curated = true; }
    else if (a === "--category" && argv[i+1]) { opts.category = argv[++i]!.toLowerCase(); }
    else if (a === "--list-categories")        { opts.listCategories = true; }
    else if (a === "--skip-installed")         { opts.skipInstalled = true; }
    // Workflow mode
    else if (a === "--workflow")               { opts.workflow = true; }
    else if (a === "--out" && argv[i+1])      { opts.out = argv[++i]!; }
    else if (a === "--list")                  { opts.list = true; }
    // Enhanced audit
    else if (a === "--ai")                    { opts.ai = true; }
    else if (a === "--domain" && argv[i+1])   { opts.domain = argv[++i]!; }
    // Cache
    else if (a === "--no-cache")              { opts.noCache = true; }
    // Factory
    else if (a === "--factory")               { opts.factory = true; }
    else if (a === "--skill-output")          { opts.skillOutput = true; }
    // Monorepo
    else if (a === "--monorepo")              { opts.monorepo = true; }
    // Search
    else if (a === "--search" && argv[i+1])   { opts.search = argv[++i]!; }
    else if (a === "--search-mode" && argv[i+1]) {
      const mode = argv[++i]!;
      if (mode === "fts" || mode === "hybrid" || mode === "vector") {
        opts.searchMode = mode;
      }
    }
    else if (a === "--pkg" && argv[i+1])      { opts.pkg = argv[++i]!; }
    // Index
    else if (a === "--index")                 { opts.index = true; }
    else if (a === "--no-index")              { opts.noIndex = true; }
    // Plugin
    else if (a === "--plugin")                { opts.plugin = true; }
    else if (a === "--agent-defs")            { opts.agentDefs = true; }
    else if (a === "--marketplace")           { opts.marketplace = true; }
    // Lockfile
    else if (a === "--freeze")                { opts.freeze = true; }
    else if (a === "--verify")                { opts.verify = true; }
    // MCP
    else if (a === "--mcp")                   { opts.mcp = true; }
    // System PATH discovery
    else if (a === "--system")                { opts.system = true; }
    // Batch processing
    else if (a === "--timeout" && argv[i+1])  {
      const val = argv[++i]!;
      const parsed = parseInt(val, 10);
      if (Number.isNaN(parsed) || parsed < 1000) {
        throw new Error(`Invalid --timeout value: "${val}" (must be >= 1000ms)`);
      }
      opts.timeout = parsed;
    }
    else if (a === "--concurrency" && argv[i+1]) {
      const val = argv[++i]!;
      const parsed = parseInt(val, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 16) {
        throw new Error(`Invalid --concurrency value: "${val}" (must be 1-16)`);
      }
      opts.concurrency = parsed;
    }
    else if (a === "--resume" && argv[i+1])   {
      const resumePath = argv[++i]!;
      // P0: Validate resume path to prevent path traversal
      if (resumePath.includes("..") || resumePath.includes("\0")) {
        throw new Error(`Invalid --resume path: "${resumePath}" — must not contain ".." or null bytes`);
      }
      opts.resume = resumePath;
    }
    // Full ecosystem integration
    else if (a === "--full")                  { opts.full = true; }
    else if (a === "--multi-runtime")         { opts.multiRuntime = true; }
    else if (a === "--output-dir" && argv[i+1]) { opts.outputDir = argv[++i]!; }
    else if (a === "--batch-size" && argv[i+1]) {
      const val = argv[++i]!;
      const parsed = parseInt(val, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        throw new Error(`Invalid --batch-size value: "${val}" (must be 1-100)`);
      }
      opts.batchSize = parsed;
    }
    // Audit plugins
    else if (a === "--audit-plugins")         { opts.auditPlugins = true; }
    else if (a === "--benchmark")             { opts.benchmark = true; }
    // Companion mode
    else if (a === "--companion")             { opts.companion = true; }
    else if (a === "--serve")                 { opts.serve = true; }
    else if (a === "--port" && argv[i+1])     {
      const val = argv[++i]!;
      const parsed = parseInt(val, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error(`Invalid --port value: "${val}" (must be 1-65535)`);
      }
      opts.port = parsed;
    }
    // Positional → prompt
    else if (!a.startsWith("--"))             { opts.prompt += (opts.prompt ? " " : "") + a; }
  }

  return opts;
}

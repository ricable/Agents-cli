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
      const parsed = parseInt(argv[++i]!, 10);
      if (Number.isNaN(parsed) || parsed < 1000) {
        throw new Error(`Invalid --timeout value: "${argv[i]}" (must be >= 1000ms)`);
      }
      opts.timeout = parsed;
    }
    else if (a === "--concurrency" && argv[i+1]) {
      const parsed = parseInt(argv[++i]!, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 16) {
        throw new Error(`Invalid --concurrency value: "${argv[i]}" (must be 1-16)`);
      }
      opts.concurrency = parsed;
    }
    else if (a === "--resume" && argv[i+1])   { opts.resume = argv[++i]!; }
    // Positional → prompt
    else if (!a.startsWith("--"))             { opts.prompt += (opts.prompt ? " " : "") + a; }
  }

  return opts;
}

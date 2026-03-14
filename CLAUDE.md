# agents-cli

Package manager for AI agent tools. Resolves, installs, analyzes, exposes CLI tools from GitHub/npm/PyPI/crates.io/local. Stored in `~/.agents-cli/`. ESM-only TypeScript, structured JSON output, dry-run safety.

> **Cross-references:** [README.md](./README.md) (usage guide, examples, full pipeline), [`.claude/skills/agents-cli-dev/SKILL.md`](./.claude/skills/agents-cli-dev/SKILL.md) (dev skill for Claude Code), [`.claude/agents/forge-expert.md`](./.claude/agents/forge-expert.md) (forge expert agent), [`deploy-local.sh`](./deploy-local.sh) (local dev launcher), [`battle-test-ecosystem.sh`](./battle-test-ecosystem.sh) (41-check validation).

## Key Deps

- `@clerk/backend` — JWT verification. Canonical import: `lib/companion/clerk-auth.ts`. `ClerkConfig` supports `authorizedParties?: string[]` (reads `CLERK_AUTHORIZED_PARTIES` env, comma-separated). `verifyClerkToken()` gets `publicMetadata` from `clerk.users.getUser()` (not session claims).
- `stripe` — official SDK in `lib/companion/billing.ts` + `examples/saas-ui/api/billing/checkout.js`. Never raw fetch. `createCheckoutSession` accepts `clerkUserId?: string` (4th arg) — embeds in `session.metadata` + `subscription_data.metadata` for webhook reverse-lookup.

## Build & Test

```bash
npm run build                            # tsup (required before running)
npm run dev                              # watch mode
npm test                                 # vitest (369 tests, 19 files)
npm run lint                             # tsc --noEmit
npx tsx bin/agents-cli.ts <cmd>          # dev (no build needed)
npx tsx score-all.ts                     # score all skills
npx tsx examples/skill-forge.ts --audit  # quality audit
bash battle-test-ecosystem.sh --quick    # battle test (41 checks)
```

## Hard Rules

- **ESM only** — `.js` extensions, named exports, no `require()`, no default exports
- **Never modify `dist/`** — edit `lib/`+`bin/`, rebuild
- **Types in `lib/types.ts`** — all shared interfaces/types
- **Security** — never bypass SSRF (`isPrivateUrl`), path traversal (`rejectPathTraversal`), size limits, input validation (`validateSource`, `validateToolName`). `fetchHtml()` github.com only; new HTTP helpers must check hosts + cap `MAX_RESPONSE_BYTES`
- **Shell safety** — `validateToolName()` + `shellQuote()` (canonical: `lib/guards.ts`, re-exported from `lib/skills.ts` for compat) before shell interpolation
- **Path containment** — `resolve(path).startsWith(resolve(baseDir) + "/")`, use `rejectPathTraversal()`
- **Promise safety** — `settled` flag prevents double-resolve/reject on streams
- **Error handling** — `toErrorMessage(err)` from `lib/output.ts`, never `(err as Error).message`
- **Structured output** — `success()`/`failure()`/`emit()` via `CliOutput<T>`. `--json`+`OUTPUT_FORMAT=json` everywhere. Error paths use `emit(failure(...))` when `--json` active
- **Dry-run** — all mutating commands support `--dry-run`
- **Atomic writes** — temp-file + rename. No `process.exit()` (use `process.exitCode`). No interactive prompts
- **No fabricated commands** — only from actual `--help` or README code blocks
- **Ecosystem-aware** — `detectToolLanguage()` checks source→topics→files→category. Never use wrong package manager
- **Binary name inference** — `inferBinaryNames()` checks Cargo.toml `[[bin]]`, Go `cmd/`, `go.mod`. Use binary names in templates
- **Frontmatter** — `parseFrontmatter()` from `lib/skills/frontmatter.ts`, never regex on full content
- **Version fallbacks** — releases→tags→`readSourceVersion()`→package.json→"0.0.0". Set `GITHUB_TOKEN` for rate limits
- **Skill descriptions** — "Use when" + action verbs + "Do NOT use for" + TechNames for trigger ≥ 0.80. Use `CATEGORY_ACTION_MAP` with `%` templates + `DOMAIN_NEGATIVE_TRIGGERS`
- **ALLOWED_FIELDS** in `guards.ts`: name, description, version, ingredients, tags, domain, allowed-tools, compatibility, license, metadata, context, argument-hint, disable-model-invocation, agent, hooks, user-invocable, model

## Source Prefixes

`owner/repo`→GitHub, `@scope/pkg`→npm scoped, `npm:X`→npm, `pypi:X`→PyPI, `crates:X`→crates.io, `./path`→local. Bare names→`pypi:` fallback.

## CLI Commands (all support `--json`)

```bash
agents-cli add owner/repo [--deep --skill --force --dry-run]
agents-cli add pypi:ruff | npm:express | crates:ripgrep | @scope/pkg | ./path
agents-cli list [--fields name,version] | describe <tool> | run <tool> [--dry-run] -- <args>
agents-cli update/remove <tool> [--dry-run] | schema <tool> [--depth 5 --refresh]
agents-cli skills generate [--from-tool <name>] | install/list/remove
agents-cli init --name "my-skill" | freeze | install | verify
agents-cli search "query" | scan ./dir [--deep] | info <name>
agents-cli mcp start | list
agents-cli plugin init | publish <name> | test [dir] | group | factory | pipeline <prompt> | index <source>
agents-cli crawl seed [--registry pypi|npm|crates|github|mcp] [--limit N] [--all]
agents-cli crawl start [--concurrency N] [--limit N] | status
agents-cli compose "prompt" [--iterations 5] [--sandbox] [--creative] [--domain X]
agents-cli compose --from-skills src-ruff,src-pytest [--creative --output <dir>]
agents-cli stats [--json]
```

## Skill Forge (`npx tsx examples/skill-forge.ts`)

```bash
--tool pypi:ruff [--deep --json --factory --monorepo --force --no-cache]
"NL query" [--limit 5 --dry-run]           # discovery
--trending [--language rust --since weekly --limit 10]
--curated [--category ai-ml/llm-inference --skip-installed --force --limit 600]
--workflow "CI/CD pipeline" [--list --skill-output]
--audit [--domain agent --ai --strict] | --search "query" [--search-mode hybrid --pkg ruff]
--index [--domain agent] | --plugin [--full --multi-runtime --domain git --ai --output-dir ~/plugins]
--agent-defs [--domain agent --ai] | --workflow-gen <dir> [--domain X --out <dir> --dry-run --json]
--marketplace [--dry-run] | --freeze | --verify | --system [--limit 20 --deep]
--mcp | --audit-plugins [--json] | --benchmark [--json]
# Flags: --deep --dry-run --json --strict --limit N --no-cache --force --domain X --ai --full
# --multi-runtime --output-dir --batch-size N --timeout <ms> --concurrency N --resume <path>
```

## Project Structure

```
bin/
  agents-cli.ts          — dispatcher; logic in bin/commands/
  agent-run.ts           — tool execution engine
  commands/              — 25 files (shared.ts has isJsonMode/pickFields/DATA_DIR/getStore)
    add|list|describe|schema|run|remove|update|search|scan|info|freeze|install|verify.ts
    skills|mcp|plugin.ts — subcommand groups
    generate|init|pipeline|publish|index-cmd|crawl|compose|stats.ts
lib/
  types.ts|index.ts|output.ts — CliOutput, Tool, ManifestEntry, success/failure/emit/toErrorMessage
  guards.ts              — validateSource/ToolName, rejectPathTraversal, shellQuote, validateOllamaUrl, cosine
  resolver.ts            — source detection + metadata (github/npm/pypi/crates/local)
  installer.ts           — download/extract/build (branch fallback: main→master→develop)
  analyzer.ts            — --help probing, deepProbe(), detectInteractionMode(), smokeTest()
  store.ts               — flat-file JSON createStore() + createSqliteStore() factory (SQLite→flat-file fallback)
  registry.ts            — 4-layer cascade (local→community→github→npm)
  skills/                — frontmatter.ts, lockfile.ts, description.ts (CATEGORY_ACTION_MAP, DOMAIN_NEGATIVE_TRIGGERS,
                           buildDescription(Tool), detectToolLanguage, inferDomain, isLikelyCli, inferLibraryInstallCommand),
                           lifecycle.ts (installTool, installSkill, listSkills, removeSkill, buildContext),
                           generators.ts (generateRichSkillMd, generateSkillDirectory, generateInstallScript)
  skills.ts              — backward-compat barrel → lib/skills/index.ts
  skill-content.ts       — buildShortDescription(ManifestEntry) [≠ buildDescription(Tool)]
  skill-tester.ts        — scoreTrigger(), testSkillSync(), scoreWorkflowQuality(), scoreContentQuality()
  skill-factory.ts       — 3-layer pipeline (structural→AI)
  mcp.ts                 — MCP bridge
  extractor.ts           — extractReadmeSections(), inferBinaryNames(), readSourceVersion()
  search.ts              — hybridSearch(), FTS5 + sqlite-vec KNN
  concurrency.ts         — AdaptiveSemaphore, TokenBucketRateLimiter, mapConcurrent()
  curated-tools.ts       — GENERAL_TOOLS, loadAllTools(projectRoot) reads examples/data/ai-ml-tools.json
  indexer.ts|indexes.ts|domains.ts|cache.ts|chunker.ts
  classifier/            — npm|github|crates|pypi.ts, libraries-io.ts (55 req/min), github-graphql.ts (cursor pagination, 4500pt budget)
  pipeline/              — intent|entity-extractor|prompt-parser|capability-map.ts,
                           agent-analyzer.ts (regex parser: imports, env, SDK calls, cross-deps),
                           workflow-manifest-inference.ts (topo sort, data flow, env merge, duration est),
                           workflow-composer.ts (WorkflowEnvVar, DataFlowEdge, SkillWorkflow extensions)
  hooks/                 — types.ts, generator.ts, validator.ts, templates/
  plugin/                — builder.ts, publisher.ts, marketplace.ts, audit-report.ts, versioning.ts
  db/                    — unified-store.ts, vec-store.ts, migrate.ts, domain-db.ts, aggregated-db.ts, sqlite.ts
  adapters/              — types.ts (SourceAdapter), registry-adapter.ts, pipeline.ts (UnifiedPipeline)
  intelligence/          — embeddings.ts, io-extractor.ts, graph-builder.ts, discovery.ts, auto-repair.ts
  composer/              — schema.ts, llm-client.ts, proposer.ts, validator.ts, iteration-loop.ts,
                           script-generator.ts, Dockerfile.sandbox
  crawler/               — worker.ts (CrawlWorker), seeders.ts
  marketplace/           — export.ts (SQLite→registry-data.json)
  monitoring/            — stats.ts
  companion/             — web-service.ts, billing.ts, oauth.ts, metering.ts, tiers.ts, clerk-auth.ts
examples/
  skill-forge.ts         — thin dispatcher → forge/ (16 mode-* modules)
  regenerate-skills.ts   — batch regeneration
  generated-skills/      — auto-generated (trigger ≥ 0.80)
  data/ai-ml-tools.json  — 502 AI/ML tool entries
  saas-ui/               — SaaS marketplace @ ui.spectredve.com (see SaaS sections below)
    index.html|marketplace.html|admin.html|playground.html|vercel.json|registry-data.json|package.json
    api/ (health|config|billing/checkout.js) | css/ (styles|admin.css)
    css/ (styles|admin|marketplace-page.css)
    js/ (app|store|api|auth|utils|marketplace|marketplace-page|registries|dashboard|product-detail|
         workflow-dag|forge-ui|economy|admin|profile.js)
tests/                   — 19 files, 369 tests
```

## Pipeline Flow

1. **Resolve** → detect format, fetch metadata (releases→tags→`readSourceVersion()`)
2. **Install** → download tarball (branch fallback), extract, deps. `HUGE_REPOS` skipped
3. **Analyze** → `deepProbe(bin, {maxDepth})` → `{tree, totalCommands}`
4. **Store** → persist JSON + CONTEXT.md
5. **Generate** → `generateSkillDirectory()` → SKILL.md+refs/+scripts/. Uses `_curatedMeta`, `_readmeSections`, `detectToolLanguage()`, `inferBinName()`, `extractCommandsFromReadme()` fallback
6. **Quality** → `testSkillSync()`: trigger≥0.80, quality≥6, content≥5. Workflows: `scoreWorkflowQuality()` 4 axes (stepCompleteness, dataFlowValidity, envVarDocumentation, setupRunnability) all≥0.5
7. **Index** → `groupByDomain()` + `generateMasterIndex()`
8. **Factory/MCP** → optional 3-layer factory, `McpBridge`
9. **Workflow Gen** → analyzes scripts→topo sort+data flow→SKILL.md+run.sh+setup.sh+workflow.md

## Scaling Infrastructure

### Unified SQLite Store (`lib/db/unified-store.ts`)
Tables: `tools`, `skills`, `workflows`, `skill_edges`, `crawl_queue`, `domains` + FTS5 + `vec_skills` (sqlite-vec). Implements `ToolStore`. Singleton: `createUnifiedStore(dataDir)` — different dataDir throws; use `getStore()` from `bin/commands/shared.ts`. Prepared statements, atomic `dequeue()`, `searchProducts()` (UNION FTS5/pagination), `listDomainsWithCounts()`, `bulkAddEdges()`.
- `CrawlStatus`: `"pending"|"processing"|"done"|"failed"` | `EdgeType`: `"io_chain"|"same_domain"|"embedding_similar"|"llm_inferred"`

### sqlite-vec (`lib/db/vec-store.ts`)
Graceful fallback via dynamic import. `createVecStore(db, dimension)` — KNN, filtered, brute-force cosine. `cosine()` in `lib/guards.ts`.

### Migration (`lib/db/migrate.ts`)
`migrateToSqlite(dataDir)` — tools.json+.skill-cache.json+generated-skills→SQLite. Seeds 27+20 domain taxonomy.

### Crawl (`lib/crawler/`)
`CrawlWorker` — adaptive concurrency, exponential backoff (1→5→30min), install-analyze-prune cycle, TOCTOU-safe (`rmSync(force:true)` without existsSync, try/catch readFileSync). `seedFromPyPI/Npm/Crates/GitHub/MCPRegistry()` via generic `seedFromLibrariesIo()`. `seedAll()` parallelizes all.

### Concurrency (`lib/concurrency.ts`)
`AdaptiveSemaphore` (CPU-aware, p95 latency), `TokenBucketRateLimiter` (`.unref()` timer), `mapConcurrent(items, fn, N)`.

### Intelligence (`lib/intelligence/`)
`embedText/Batch()` (Ollama), `embedAllSkills()`, `extractIOProfile()` → `{inputs, outputs, sideEffects, categories}`, `buildSkillGraph()` (4 edge types, inverted index O(n*k)), `discoverSkills()` (semantic/domain-semantic/multi-hop-llm/graph-traversal), `autoRepairSkill()` (LLM, 3 retries).

### Composer (`lib/composer/`)
`TieredLLMClient`: propose/repair→Ollama, validate/refine→Claude API. `composeWorkflow()`: propose→validate→refine (3-5 iters, target≥0.8). `WorkflowYAML` + template serializer (no yaml dep). Optional Docker sandbox. `generateRunScript()`, `generateSetupScript()`, `generateSkillMd()`.

### Adapters (`lib/adapters/`)
`SourceAdapter` interface + `SkillCandidate` intermediate format. `UnifiedPipeline` routes by source prefix.

## Skill Quality

`scoreTrigger()` (max 1.0): +0.3 "Use when", +0.4 action verbs (3x0.15 from 60+ verbs), +0.2 "Do NOT use for", +0.1 comma triggers (≥2 clauses), +0.1 TechNames (≥2 capitalized). Auto-generated via `CATEGORY_ACTION_MAP`+`DOMAIN_NEGATIVE_TRIGGERS`+`detectToolLanguage()`.

## Plugin System

`.claude-plugin/plugin.json` (only: name, version, description, keywords, license), `skills/<name>/SKILL.md+refs+scripts`, `agents/<name>.md` (YAML frontmatter+prompt), `commands/<name>.md`. Basic: 2 cmds, 1 agent. Full (`--full`): 8 cmds, multi-agents, hooks (7 event types), settings.json, CLAUDE.md, team skills. `--multi-runtime` adds pi-mono+opencode. Domains flattened (`ai-ml/x`→`ai-ml-x`), no external path refs, `$ARGUMENTS` for user input.

Key: `buildPlugins(opts)`, `generateHooksJson()`, `generatePluginCommands()`, `auditPlugin(dir)`, `generateMarketplace(opts)`, `publishPlugin(domain, dryRun)`, `computePluginHash(dir)`, `bumpVersion(current, type)`.

## Workflow Generation (`--workflow-gen`)

Analyzes agent scripts (.py/.ts/.js/.sh) → infers manifest (topo sort, data flow, env vars) → generates output in `examples/generated-workflows/<name>/`: SKILL.md, scripts/run.sh, scripts/setup.sh, references/workflow.md, agents/*.py.

`agent-analyzer.ts` — pure regex parser, 50+ SDK patterns, extracts imports/env/IO/cross-deps. `workflow-manifest-inference.ts` — topo sort, data flow, duration est.

**Tier entitlements** (`lib/companion/tiers.ts`): Free=view-only, Starter=5/mo, Pro/Enterprise=unlimited+publish.

**SaaS workflow features:** Workflows tab (2nd after All, NEW badge), mini pipeline preview on cards, step count+duration, Pipeline tab default in detail modal (DAG via `workflow-dag.js`, step table, env vars). `"workflow"` in ProductType union — include in exhaustiveness checks.

## SaaS UI (`examples/saas-ui/`)

Deployed to `ui.spectredve.com` via Vercel. Deploy from this dir only (not repo root).

### Deployment
```bash
cd examples/saas-ui && vercel --prod    # production deploy
git tag v1.2.0 && git push --tags      # GH Actions prod deploy
```
GH Actions: push any branch→preview, push `v*` tag→production. Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID` (`team_sPtjjiJVOLGPrwDr8PCCHqqU`), `VERCEL_PROJECT_ID` (`prj_a8P8OO3AkotB3hR5Yoq4F01oXyve`). Vercel env: `STRIPE_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`.

### Key Rules
- `vercel.json`: `/admin`→admin.html, `/marketplace`→marketplace.html, `/api/*`→serverless, SPA fallback (excludes admin/marketplace/api), no-cache HTML, 1yr assets
- `registry-data.json` is static data source for all marketplace tabs
- `api.js` auto-detects baseUrl: `localhost:3100` dev, `''` prod
- `AuthManager` falls back to mock OAuth when server unavailable
- Marketplace re-renders on `catalog-updated` event from `registries.js`

### Structure
- `index.html` — landing page + forge, JetBrains Mono, `#workflowShowcase` (between Chrome Extension & Marketplace sections for conversion flow), 50% OFF promo pricing with yearly toggle, "7 Product Types", workflow value comparison row. Links to `/marketplace` for full marketplace
- `marketplace.html` — **dedicated standalone marketplace page** at `/marketplace` with own nav, hero, walkthrough, sources, workflows, demos, browse grid, pricing. Own CSS (`css/marketplace-page.css`) + JS (`js/marketplace-page.js`). NOT part of index.html SPA
- `admin.html` — standalone admin SPA at `/admin`, auth-gated, hash routing (#dashboard/#economy/#keys/#settings). Design: command bridge — `#030308` bg, `#00d4ff` cyan accents, fixed 220px sidebar, monospace, pulsing indicators, scan-line top bar (`css/admin.css`)
- `js/utils.js` — canonical: PRODUCT_TYPE_ICONS/COLORS, formatType(), escapeHtml(), showToast()
- `js/marketplace.js` — grid, tier gating, TIER_LIMITS/getRequiredTier()/userHasAccess() (canonical), bulk select, `catalog-updated` event. `initMarketplace(api, store, showProductDetail, auth)` — 4 args
- `js/product-detail.js` — 4-tab detail (overview/pricing/changelog/pipeline), SSE, DAG. Workflows default to Pipeline tab. `renderStepTable(steps, {enhanced?: true})` for zebra striping
- `js/workflow-dag.js` — pure CSS/HTML DAG (`.wf-dag-arrow-animated` gradient-pulse, `.wf-dag-node-glow` hover, artifact float)
- `js/admin.js` — imports api/store/auth/dashboard/economy, auth gate, inline API key CRUD+settings
- `js/profile.js` — `openSettingsModal()` redirects to /admin#settings

### Auth & Store
`AuthManager`: loginWithGoogle/Github/Email(), signupWithEmail(), logout(), isLoggedIn(), getUser() → `{email, name, avatar, provider, token}`, getTier(), onAuthChange(cb), checkout(priceId). `AppStore`: get/set/update(key, fn)/subscribe(key|'*', cb), getMonthlyInstallCount(), incrementInstallCount(). Persisted: user, tier, installed, earnings, agentKeys, monthlyInstalls `{count, month: "YYYY-MM"}`. **NOT persisted**: searchFilters (session-only — stale filters cause 0 products bug).

### Pricing
- All tiers→`POST /api/billing/checkout`→Stripe Checkout session (subscription mode)→redirect. `handleCheckout(priceId)` sends `{priceId, successUrl, cancelUrl}`. Generic button handler in `app.js` skips buttons with `data-price-id`
- Original: Starter $29 `price_1TAsLJ2QpzdUwTFgn4OhkLig`, Pro $79 `price_1TAsLK2QpzdUwTFgqe4HP5Jh`, Enterprise $199 `price_1TAsLK2QpzdUwTFgZQQ56NrE`
- **Active 50% promo**: Starter $14.99 `price_1TAumR2QpzdUwTFgUWWQsbTe`, Pro $39.99 `price_1TAumW2QpzdUwTFgMyJIn89A`, Enterprise $99 `price_1TAumX2QpzdUwTFgDDWYS4V8`
- Both in allowlist (`checkout.js`+`web-service.ts` `PRICE_TO_TIER`). End promo: swap `data-price-id` in `index.html` + `handleCheckout()` in `app.js`
- Promo CSS: `.tier-price-promo` wrapper, `.price-original` (strikethrough), `.promo-amount` (green glow), `.promo-ribbon` (`clip-path: polygon()` — test cross-browser)
- `TIER_LIMITS`: `{ free: 3, starter: 50, pro: 500, enterprise: Infinity }`. Tier upsell banner (`#tierUpsellBanner`) + value comparison (`#valueComparisonSection`) hidden when not free
- `?checkout=success` triggers toast+URL cleanup

## Companion API (`lib/companion/web-service.ts` @ :3100)

Static files from `examples/saas-ui/`. All `/api/*` require `Authorization: Bearer <token>`. Auth: API-key SHA256 first, Clerk JWT fallback. Tier from `user.publicMetadata.tier` (set by Stripe webhook). Webhook handles checkout.session.completed/subscription.updated/deleted→updates `clerk.users.updateUserMetadata(userId, {tier, stripeCustomerId})`. `clerkUserId` stored in Stripe customer+session metadata for reverse-lookup. `STRIPE_WEBHOOK_SECRET` must be `whsec_...`.

```
GET  /api/health|config|auth/me|catalog|usage|earnings|catalog/domains|graph/:skillId
GET  /api/catalog?page=1&limit=50&domain=X&type=Y&sort=quality&q=Z
GET  /api/status/:jobId | download/:jobId | agents/:id/metrics | agents/:id/heatmap
GET  /api/invocations/stream?skill=X    — SSE mock (3-8s)
GET  /api/config                        — {publishableKey} for Clerk init (public, no auth)
POST /api/generate | billing/checkout | billing/webhook | agent-keys
GET  /api/billing/portal
DELETE /api/agent-keys/:id
```

## Local Dev

```bash
./deploy-local.sh                        # build + serve :8080 + companion :3100
./deploy-local.sh --no-build             # skip build
./deploy-local.sh --port 3000            # different UI port
npx tsx examples/skill-forge.ts --companion --serve --port 3100  # manual
stripe listen --forward-to localhost:3100/api/billing/webhook    # webhook testing
stripe trigger checkout.session.completed                        # test trigger
```
Env (`.env`, gitignored): `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (`whsec_...` from `stripe listen`). Auto-loaded on startup, does NOT override existing env.

## Key Function Signatures

```typescript
// Output (lib/output.ts)
success<T>(cmd, data, startTime): CliOutput<T>
failure(cmd, code, msg, startTime): CliOutput<never>
emit<T>(result, json): void
toErrorMessage(err: unknown): string

// Guards (lib/guards.ts)
validateSource(source): void | validateToolName(name): void | rejectPathTraversal(path, label): void
shellQuote(s): string | validateOllamaUrl(url): void | cosine(a, b: Float32Array): number

// Analysis (lib/analyzer.ts)
deepProbe(bin, {maxDepth}): {tree, totalCommands}
detectInteractionMode(cmds, flags, help?): "repl"|"subcommand"|"single"
smokeTest(tool, installDir, cachedBin?): SmokeTestResult

// Skills (lib/skills/*)
parseFrontmatter(content): SkillFrontmatter | null       // frontmatter.ts
discoverResources(skillDir): SkillResources              // frontmatter.ts
computeIntegrity(uri, version): string                   // lockfile.ts
writeLockfile(path, tools): void                         // lockfile.ts
buildDescription(tool: Tool): string                     // description.ts
detectToolLanguage(tool): ToolLanguage                   // description.ts
installTool(source, dataDir, opts): Promise<Tool>        // lifecycle.ts
listSkills(dataDir): InstalledSkillMeta[]                // lifecycle.ts
generateSkillDirectory(tool): SkillDirectory             // generators.ts

// Quality (lib/skill-tester.ts)
testSkillSync(path, preloaded?): SkillTestResult | scoreTrigger(desc): number | scoreContentQuality(md): {score, issues}

// Classifiers — all: (query?, limit?) → Promise<ExtendedManifestEntry[]>
discoverNpmPackages | discoverGitHubRepos | discoverCratesPackages | discoverPyPIPackages

// Extractor (lib/extractor.ts)
extractReadmeSections(readme, maxChars?): ReadmeSections | inferBinaryNames(repoDir): string[] | readSourceVersion(repoDir): string | undefined

// Indexes (lib/indexes.ts)
groupByDomain(entries): Map<string, ManifestEntry[]> | generateMasterIndex(manifest, triggers): string

// Workflow (lib/pipeline/)
analyzeAgentScript(path): AgentScriptAnalysis | inferWorkflowManifest(analyses): WorkflowManifest
scoreWorkflowQuality(skillMd): WorkflowQualityResult

// Clerk (lib/companion/clerk-auth.ts)
verifyClerkToken(req, config: ClerkConfig): Promise<ClerkSession | null>
updateUserMetadata(userId, metadata, config): Promise<void>
// ClerkSession: { userId, sessionId, email?, publicMetadata } | ClerkConfig: { secretKey, publishableKey?, authorizedParties? }

// Intelligence: embedText/Batch(), embedAllSkills(), extractIOProfile(), buildSkillGraph(), discoverSkills(), autoRepairSkill()
// Composer: composeWorkflow(), proposeWorkflow(), validateWorkflow(), TieredLLMClient.generate()
// Crawler: CrawlWorker.start(), seedFromPyPI/Npm/Crates/GitHub/MCPRegistry(), seedAll()
// Monitoring: gatherStats(dataDir) | Marketplace: exportRegistryData(dataDir, outputPath)
```

## Data Directory

```
~/.agents-cli/tools.json         — legacy flat-file (migrated to SQLite)
~/.agents-cli/agents-cli.db      — unified SQLite (tools/skills/workflows/edges/crawl)
~/.agents-cli/tools/<id>/        — package/ (pruned in crawl) + CONTEXT.md
~/.agents-cli/skills/<name>/     — skill.json + CONTEXT.md
```

## Common Pitfalls

- `ai-ml-tools.json` at `examples/data/` (not root). SaaS UI at `examples/saas-ui/` (not root)
- `loadAllTools(projectRoot)` needs project root, not data dir
- Bare names (e.g. `ruff`) need `pypi:` prefix to match FORMAT_PATTERNS
- `IntentResult.intent` (not `.type`); `ExtractedEntity.packageName` (not `.packages`); `ToolCapabilities.commands` is `readonly` (use spread)
- Cache: `repoSha: "unknown"` treated as miss (PyPI never stale-hit)
- Linter hook may auto-add imports or revert changes — re-read after edits
- `AgentsApi.baseUrl` (not `._base`)
- `clerkPublishableKey: null` → CLERK_SECRET_KEY not loaded; restart after `.env` edit
- Clerk `publicMetadata` from `clerk.users.getUser().publicMetadata` (not session `public_metadata`)
- `sqlite-vec`/`@anthropic-ai/sdk` optional — dynamic import via variable (`const m = "sqlite-vec"; await import(m)`)
- Promo prices are display-only — don't create new Stripe prices. Workflow `.workflow-card` has cyan left border, `.wf-pulse` gradient-pulse on arrows

## Do NOT

- Add `yaml`/`js-yaml` — custom parser in `lib/skills/frontmatter.ts`, template serializer in `lib/composer/schema.ts`
- Skip build, remove security guards, use `process.exit()`, add interactive prompts, use `require()`
- Bypass `CliOutput<T>`, hardcode `dryRun: false`, use bare `console.error` with `--json`
- Add HTTP helpers without SSRF checks, use magic numbers, match frontmatter with regex
- Fabricate CLI subcommands not in actual `--help` or README code blocks
- Write files outside output dir, interpolate unsanitized input into shell
- Use `existsSync` before `rmSync(force:true)` or `readFileSync` with error handling (TOCTOU)
- Use same trigger text for different categories; suggest wrong package managers
- Import `shellQuote` from `lib/skills.ts`, `@clerk/backend` directly, `showToast`/`escapeHtml`/`formatType`/`PRODUCT_TYPE_ICONS` from `marketplace.js`/`product-detail.js`, `cosine`/`validateOllamaUrl` from anywhere except `lib/guards.ts` — see Canonical Imports below
- Call `createUnifiedStore()` directly in commands — use `getStore()` from `bin/commands/shared.ts`
- Re-add dashboard/economy/keys to `index.html` (→`admin.html`). Don't merge marketplace.html back into index.html — it's a dedicated standalone page
- Use direct Stripe payment links — all tiers via `POST /api/billing/checkout`. Don't hardcode price IDs outside `app.js`
- Add D3/Mermaid — `workflow-dag.js` is pure CSS/HTML
- Bypass workflow quality gates (4 axes≥0.5) or lower compose threshold (≥0.8)
- Put workflow tier entitlements outside `lib/companion/tiers.ts`
- Change promo prices without updating all 3 views (monthly/yearly/comparison)
- Remove/reorder `#workflowShowcase` section or override workflow detail Pipeline tab default
- Bypass crawl queue — use `CrawlWorker` with adaptive concurrency
- Set `STRIPE_WEBHOOK_SECRET` to `sk_test_...` — must be `whsec_...`
- Duplicate tier logic — use `getRequiredTier()`/`userHasAccess()` from `marketplace.js`

## Canonical Imports

| Symbol | From | Not From |
|---|---|---|
| `shellQuote`, `cosine`, `validateOllamaUrl`, `DEFAULT_OLLAMA_URL` | `lib/guards.ts` | `lib/skills.ts` or elsewhere, hardcoded URLs |
| `@clerk/backend` | `lib/companion/clerk-auth.ts` | direct import |
| `showToast`, `escapeHtml`, `formatType`, `PRODUCT_TYPE_ICONS/COLORS` | `js/utils.js` | `marketplace.js`, `product-detail.js` |
| `TIER_LIMITS`, `getRequiredTier`, `userHasAccess` | `js/marketplace.js` | don't duplicate |
| Stripe SDK | `lib/companion/billing.ts` | raw fetch |
| `getStore()` | `bin/commands/shared.ts` | `createUnifiedStore()` directly |

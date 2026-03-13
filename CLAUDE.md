# agents-cli

Package manager for AI agent tools. Resolves, installs, analyzes, exposes CLI tools from GitHub/npm/PyPI/crates.io/local. Stored in `~/.agents-cli/`. Built on "Rewrite Your CLI for AI Agents" — structured JSON output, schema introspection, context window discipline, input hardening, rich skill generation, multi-surface output, dry-run safety.

> See **README.md** for full usage guide, examples, and architecture overview.

## Key Dependencies

- `@clerk/backend` — Clerk JWT verification (server-side). Canonical import location: `lib/companion/clerk-auth.ts`. `ClerkConfig` now supports `authorizedParties?: string[]` (reads `CLERK_AUTHORIZED_PARTIES` env var, comma-separated). `verifyClerkToken()` gets `publicMetadata` from `clerk.users.getUser()` (not session claims).
- `stripe` — official Stripe Node.js SDK used by `StripeProvider` in `lib/companion/billing.ts` (customers, checkout, billing portal, invoices, webhook verification). Do NOT use raw fetch for Stripe API calls. `createCheckoutSession` now accepts `clerkUserId?: string` (4th arg) — embeds it in `session.metadata` + `subscription_data.metadata` for webhook reverse-lookup.

## Build & Test

```bash
npm run build          # tsup (required before running)
npm run dev            # watch mode
npm test               # vitest (369 tests, 19 files)
npm run lint           # tsc --noEmit
npx tsx bin/agents-cli.ts <cmd>          # dev mode (no build needed)
npx tsx score-all.ts                     # score all skills
npx tsx examples/skill-forge.ts --audit  # quality audit
bash battle-test-ecosystem.sh --quick    # battle test (41 checks)
```

## Hard Rules

- **ESM only** — `.js` extensions on all imports, named exports only, no `require()`, no default exports
- **Never modify `dist/`** — edit `lib/` + `bin/`, then rebuild with `npm run build`
- **Types in `lib/types.ts`** — all shared interfaces/types defined there
- **Security** — never bypass SSRF (`isPrivateUrl`), path traversal (`rejectPathTraversal`), size limits, input validation (`validateSource`, `validateToolName`)
- **SSRF**: `fetchHtml()` github.com only; `fetchJson()` uses `isPrivateUrl()`. New HTTP helpers must check hosts + cap response size (`MAX_RESPONSE_BYTES`)
- **Shell safety** — `validateToolName()` + `shellQuote()` (from `lib/guards.ts`) before interpolating into shell
- **Path containment** — `resolve(path).startsWith(resolve(baseDir) + "/")`. Use `rejectPathTraversal()` on user paths
- **Promise safety** — `settled` flag to prevent double-resolve/reject on streams
- **Error handling** — `toErrorMessage(err)` from `lib/output.ts`, never `(err as Error).message`
- **Structured output** — all commands use `success()`/`failure()`/`emit()` via `CliOutput<T>`. `--json` + `OUTPUT_FORMAT=json` everywhere. Error paths use `emit(failure(...))` when `--json` active
- **Dry-run** — all mutating commands support `--dry-run` (file writes, index gen, lockfile)
- **No interactive prompts** — CI/agent-friendly
- **Atomic writes** — temp-file + rename pattern
- **No `process.exit()`** — use `process.exitCode`
- **No fabricated commands** — only from actual `--help` or README code blocks
- **Ecosystem-aware** — `detectToolLanguage()` checks source→topics→files→category. Never use the wrong package manager
- **Binary name inference** — `inferBinaryNames()` checks Cargo.toml `[[bin]]`, Go `cmd/`, `go.mod`. Use binary names in templates
- **Frontmatter** — use `parseFrontmatter()` return values (from `lib/skills/frontmatter.ts`), never regex on full content
- **Version fallbacks** — GitHub releases→tags→`readSourceVersion()`→package.json→"0.0.0". Set `GITHUB_TOKEN` for higher rate limits
- **Skill descriptions** — must have "Use when" + action verbs + "Do NOT use for" + TechNames for trigger score ≥ 0.80. Use `CATEGORY_ACTION_MAP` with `%` templates. `DOMAIN_NEGATIVE_TRIGGERS` for negative clauses
- **Frontmatter fields** — `ALLOWED_FIELDS` in `guards.ts`: name, description, version, ingredients, tags, domain, allowed-tools, compatibility, license, metadata, context, argument-hint, disable-model-invocation, agent, hooks, user-invocable, model
- **shellQuote canonical location** — `lib/guards.ts`. Re-exported from `lib/skills.ts` for compat. In new code always import from `./guards.js`

## Source Prefixes

| Prefix | Example | Registry |
|--------|---------|----------|
| (none) | `owner/repo` | GitHub |
| `@scope/` | `@anthropic-ai/sdk` | npm scoped |
| `npm:` | `npm:express` | npm bare |
| `pypi:` | `pypi:ruff` | PyPI |
| `crates:` | `crates:ripgrep` | crates.io |
| `./` `/` | `./local-path` | local |

Bare names (e.g. `httpie`) → `pypi:` fallback.

## CLI Commands (all support `--json`)

```bash
# Tools: add/list/describe/run/update/remove (all support --dry-run)
agents-cli add owner/repo [--deep --skill --force --dry-run]
agents-cli add pypi:ruff | npm:express | crates:ripgrep | @scope/pkg | ./path
agents-cli list [--fields name,version]
agents-cli describe <tool> [--fields commands,globalFlags]
agents-cli run <tool> [--dry-run] -- <args>
agents-cli update/remove <tool> [--dry-run]

# Schema introspection
agents-cli schema <tool> [--depth 5 --refresh --json]

# Skills
agents-cli skills generate [--from-tool <name>]
agents-cli skills install/list/remove
agents-cli init --name "my-skill"

# Lockfile
agents-cli freeze | install | verify

# Registry
agents-cli search "query" | scan ./dir [--deep] | info <name>

# MCP
agents-cli mcp start | list

# Plugin (Claude Code spec)
agents-cli plugin init | publish <name> | test [dir] | group | factory | pipeline <prompt> | index <source>
```

## Skill Forge (`npx tsx examples/skill-forge.ts`)

```bash
# Direct tool
--tool pypi:ruff [--deep --json --factory --monorepo --force --no-cache]

# Discovery (NL → multi-registry search)
"build a RAG pipeline" [--limit 5 --dry-run]

# Modes
--trending [--language rust --since weekly --limit 10]
--curated [--category ai-ml/llm-inference --skip-installed --force --limit 600]
--workflow "CI/CD pipeline" [--list --skill-output]
--audit [--domain agent --ai --strict]
--search "query" [--search-mode hybrid --pkg ruff]
--index [--domain agent]
--plugin [--full --multi-runtime --domain git --ai --output-dir ~/plugins]
--agent-defs [--domain agent --ai]
--marketplace [--dry-run]
--freeze | --verify
--system [--limit 20 --deep]
--mcp
--audit-plugins [--json]
--benchmark [--json]

# Common flags: --deep --dry-run --json --strict --limit N --no-cache --force
# --domain X --ai --full --multi-runtime --output-dir --batch-size N
# --timeout <ms> --concurrency N --resume <path> --no-index
```

## Project Structure

```
bin/
  agents-cli.ts       — 67-line dispatcher; all logic in bin/commands/
  agent-run.ts        — tool execution engine
  commands/           — 22 command files (one registerXCommand per file)
    shared.ts         — isJsonMode(), pickFields(), DATA_DIR
    add.ts / list.ts / describe.ts / schema.ts / run.ts
    remove.ts / update.ts / search.ts / scan.ts / info.ts
    freeze.ts / install.ts / verify.ts
    skills.ts         — skills subcommand group
    mcp.ts            — mcp subcommand group
    plugin.ts         — plugin subcommand group
    generate.ts / init.ts / pipeline.ts / publish.ts / index-cmd.ts
lib/
  types.ts            — CliOutput, Tool, ManifestEntry, etc.
  index.ts            — public SDK entry (re-exports everything)
  output.ts           — success(), failure(), emit(), toErrorMessage()
  guards.ts           — validateSource, validateToolName, rejectPathTraversal, shellQuote
  resolver.ts         — source detection + metadata (github/npm/pypi/crates/local)
  installer.ts        — download, extract, build (branch fallback: main→master→develop)
  analyzer.ts         — --help probing, deepProbe(), detectInteractionMode()
  store.ts            — flat-file JSON store + CONTEXT.md
  registry.ts         — 4-layer cascade (local→community→github→npm)
  skills.ts           — backward-compat barrel → lib/skills/index.ts
  skills/             — split from monolithic skills.ts (3105 → 5 focused modules)
    frontmatter.ts    — parseFrontmatter(), discoverResources(), RESOURCE_DIRS
    lockfile.ts       — computeIntegrity(), parseLockfile(), writeLockfile(), readLockfile()
    description.ts    — CATEGORY_ACTION_MAP, DOMAIN_NEGATIVE_TRIGGERS, buildDescription(tool)
                        detectToolLanguage(), inferDomain(), isLikelyCli(), inferLibraryInstallCommand()
    lifecycle.ts      — installTool(), installSkill(), listSkills(), removeSkill(), buildContext()
    generators.ts     — generateRichSkillMd(), generateSkillDirectory(), generateInstallScript()
    index.ts          — re-exports all public symbols
  skill-content.ts    — structural SKILL.md gen; buildShortDescription(entry: ManifestEntry)
  skill-tester.ts     — quality gate: scoreTrigger(), testSkillSync()
  skill-factory.ts    — 3-layer pipeline (structural→AI)
  mcp.ts              — MCP bridge
  extractor.ts        — README parsing, inferBinaryNames(), readSourceVersion()
  curated-tools.ts    — 91 general tools; loadAllTools() reads examples/data/ai-ml-tools.json
  search.ts / indexer.ts / indexes.ts / domains.ts / cache.ts / chunker.ts
  classifier/         — npm.ts, github.ts, crates.ts, pypi.ts
  pipeline/           — intent.ts, entity-extractor.ts, prompt-parser.ts, capability-map.ts
  hooks/              — types.ts, generator.ts, validator.ts, templates/
  plugin/             — builder.ts, publisher.ts, marketplace.ts, audit-report.ts, versioning.ts, ...
  db/                 — domain-db.ts, aggregated-db.ts, sqlite.ts
  companion/          — web-service.ts, billing.ts, oauth.ts, metering.ts, tiers.ts, clerk-auth.ts, ...
examples/
  skill-forge.ts      — thin dispatcher → forge/ modules
  forge/              — types, helpers, parse-args, stages, 15 mode-* modules
  regenerate-skills.ts — batch regeneration
  generated-skills/   — auto-generated skills (trigger ≥ 0.80)
  data/
    ai-ml-tools.json  — 502 AI/ML tool entries (was at project root, now here)
  saas-ui/            — SaaS marketplace UI, deployed to https://ui.spectredve.com
    index.html        — main app (Agent Economy pane, API Keys pane, Forge enhancements)
    css/styles.css    — design system + economy / heatmap / bulk-select styles
    vercel.json       — Vercel static deploy config (SPA rewrites, no-cache HTML, long-cache assets)
    registry-data.json — static data for marketplace: github/npm/pypi/crates/agent_defs/harnesses/cli_anything/generated_skills
    js/
      app.js          — bootstrap, router, auth wiring, nav state, modal logic
      store.js        — AppStore pub/sub + localStorage (searchFilters excluded — session-only)
      api.js          — AgentsApi; auto-detects baseUrl (localhost:3100 dev, '' prod)
      auth.js         — AuthManager: loginWithGoogle/Github/Email, logout, onAuthChange, mock fallback
      marketplace.js  — product grid, agent-native filter, bulk select, Try button, catalog-updated event
      registries.js   — registry panes (GitHub/npm/PyPI/crates/cli-anything); injects agent_defs+generated_skills into catalog
      dashboard.js    — revenue tracker, agent wallet, heatmap, API keys section
      product-detail.js — 3-tab detail (overview/pricing/changelog), SSE feed
      forge-ui.js     — cost estimator, quality preview, persona selector, batch CSV
      economy.js      — agent economy: earnings, leaderboard, sparklines
    playground.html   — SaaS playground demo
tests/                — 19 test files, 369 tests
```

## Pipeline Flow

1. **Resolve** — detect format, fetch metadata. GitHub: releases→tags→`readSourceVersion()`. Local: package.json→basename
2. **Install** — download tarball (branch fallback), extract, install deps. `HUGE_REPOS` skipped
3. **Analyze** — `--help` parsing, recursive. `deepProbe(bin, {maxDepth})` → `{tree, totalCommands}`
4. **Store** — persist JSON + CONTEXT.md
5. **Generate** — `generateSkillDirectory()` → SKILL.md + refs/ + scripts/. Uses `_curatedMeta` for triggers, `_readmeSections` for content, `detectToolLanguage()` for ecosystem, `inferBinName()` for binary names, `extractCommandsFromReadme()` fallback when 0 commands
6. **Quality** — `testSkillSync()`: trigger ≥ 0.80, quality ≥ 6, content ≥ 5
7. **Index** — `groupByDomain()` + `generateMasterIndex()`
8. **Factory** — `runSkillFactory()` optional 3-layer
9. **MCP** — `McpBridge` exposes tools

## Skill Quality

`scoreTrigger()` (max 1.0, clamped): +0.3 "Use when", +0.4 action verbs (3×0.15 from 60+ verbs), +0.2 "Do NOT use for", +0.1 comma triggers (≥2 clauses), +0.1 TechNames (≥2 capitalized words). `buildDescription()` in `lib/skills/description.ts` auto-generates via `CATEGORY_ACTION_MAP` + `DOMAIN_NEGATIVE_TRIGGERS` + `detectToolLanguage()`. Note: `buildShortDescription()` in `lib/skill-content.ts` is a separate function for `ManifestEntry` structural content.

## Plugin System (Claude Code spec)

**Structure** — `.claude-plugin/plugin.json` (official fields only: name, version, description, keywords, license), `skills/<name>/SKILL.md+refs+scripts`, `agents/<name>.md` (YAML frontmatter+prompt), `commands/<name>.md`

**Basic** (`--plugin`): 2 commands, 1 agent. **Full** (`--plugin --full`): 8 commands, multi-agents, hooks (7 event types), settings.json, CLAUDE.md, team skills. `--multi-runtime` adds pi-mono + opencode adapters.

**Rules** — no non-standard plugin.json fields, skills self-contained, domains flattened (`ai-ml/x`→`ai-ml-x`), no external path refs, `$ARGUMENTS` for user input in commands.

**Key functions**: `buildPlugins(opts)`, `generateHooksJson(domain, entries)`, `generatePluginCommands(domain, entries)`, `auditPlugin(dir)`, `generateMarketplace(opts)`, `publishPlugin(domain, dryRun)`, `computePluginHash(dir)`, `bumpVersion(current, type)`

## SaaS UI Deployment

Linked Vercel project: `saas-ui` (in `examples/saas-ui/.vercel/project.json`). Domain: `ui.spectredve.com` → Cloudflare CNAME → Vercel.

```bash
# Deploy production (run from examples/saas-ui/)
cd examples/saas-ui && vercel --prod

# Redeploy after changes
vercel --prod

# Check deployments
vercel ls
```

**Key rules:**
- `vercel.json` rewrites all non-asset paths to `index.html` (SPA routing)
- HTML served with `no-cache, no-store` — assets (js/css/woff/png/svg) cached 1 year immutable
- `registry-data.json` is the static data source for all marketplace tabs — edit to add/update products
- `api.js` auto-detects API base: `localhost:3100` when running locally, `''` (relative) in production
- `AuthManager` falls back to mock OAuth when server unavailable — always works offline
- `searchFilters` is **session-only state** (not persisted to localStorage) — stale filters caused 0 products bug
- Marketplace re-renders on `catalog-updated` custom event fired by `registries.js` after async inject

## GitHub Actions Deploy (.github/workflows/deploy.yml)

| Trigger | Action |
|---|---|
| Push any branch | Vercel preview deploy |
| Push tag `v*` | Vercel production deploy → ui.spectredve.com |

Required secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID` (`team_sPtjjiJVOLGPrwDr8PCCHqqU`), `VERCEL_PROJECT_ID` (`prj_a8P8OO3AkotB3hR5Yoq4F01oXyve`)

```bash
# Release to production
git tag v1.2.0 && git push --tags
```

## Local Dev

```bash
# Start both servers (sources .env, validates keys, opens browser)
./deploy-local.sh              # build + serve saas-ui :8080 + companion :3100
./deploy-local.sh --no-build   # skip npm build
./deploy-local.sh --port 3000  # different UI port

# Manual companion start (loads .env automatically)
npx tsx examples/skill-forge.ts --companion --serve --port 3100

# Stripe webhook local testing
stripe listen --forward-to localhost:3100/api/billing/webhook
stripe trigger checkout.session.completed
```

**Ports:** SaaS UI → :8080, Companion API → :3100

**Env vars** (in `.env` at project root, gitignored):
```
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen` output
```
`skill-forge.ts` auto-loads `.env` on startup (does NOT override existing process.env vars).

## SaaS UI Auth (examples/saas-ui/js/auth.js)

`AuthManager` — wire in `app.js` via `new AuthManager(api, store)`.

```javascript
import { AuthManager } from './auth.js';
const auth = new AuthManager(api, store);

auth.loginWithGoogle()         // PKCE OAuth popup → mock fallback
auth.loginWithGithub()         // PKCE OAuth popup → mock fallback
auth.loginWithEmail(email, pw) // mock always succeeds
auth.signupWithEmail(email, pw)
auth.logout()                  // clears store user/tier, fires onAuthChange(null)
auth.isLoggedIn()              // → boolean
auth.getUser()                 // → {email, name, avatar, provider, token} | null
auth.getTier()                 // → 'free' | 'starter' | 'pro' | 'enterprise'
auth.onAuthChange(cb)          // → unsubscribe fn; cb(user | null)
auth.checkout(priceId)         // opens billing portal or mock
```

`AppStore` — reactive pub/sub with localStorage persistence.

```javascript
import { AppStore } from './store.js';
store.get(key)               // read state
store.set(key, value)        // write + notify + autoPersist
store.update(key, fn)        // set(key, fn(current))
store.subscribe(key, cb)     // → unsubscribe fn; cb(value, old)
store.subscribe('*', cb)     // wildcard: cb(key, value, old)
// Persisted keys: user, tier, installed, earnings, agentKeys
// NOT persisted: searchFilters (session-only to prevent stale filter bugs)
```

## SaaS Companion API (lib/companion/web-service.ts)

Served at `:3100`. Static files served from `examples/saas-ui/`. All `/api/*` endpoints require `Authorization: Bearer <token>`.

Auth is dual-mode: API-key SHA256 checked first, then Clerk JWT fallback via `verifyClerkToken()`.

- Clerk tier is read from `user.publicMetadata.tier` (set by Stripe webhook on subscription events)
- Stripe webhook at `POST /api/billing/webhook` handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → updates `clerk.users.updateUserMetadata(userId, { tier, stripeCustomerId })`
- `clerkUserId` stored in Stripe customer metadata + checkout session metadata for webhook reverse-lookup
- `STRIPE_WEBHOOK_SECRET` must be `whsec_...` format (from `stripe listen` or Stripe Dashboard → Webhooks → Signing secret)

Required env vars: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

```
GET  /api/health
GET  /api/config                       — returns {publishableKey} for frontend Clerk init (public, no auth)
GET  /api/auth/me
GET  /api/catalog
GET  /api/usage
POST /api/generate                     — async skill generation
GET  /api/status/:jobId
GET  /api/download/:jobId
POST /api/billing/checkout
GET  /api/billing/portal
POST /api/billing/webhook              — Stripe webhook (raw body + stripe-signature header)
GET  /api/earnings?period=month        — creator revenue summary
GET  /api/agents/:id/metrics           — call/cost/latency metrics stub
GET  /api/agents/:id/heatmap           — 24h invocation heatmap stub
POST /api/agent-keys                   — create key {id, secret, scopes, createdAt}
DELETE /api/agent-keys/:id             — revoke key
GET  /api/invocations/stream?skill=X   — SSE: live invocation events (mock every 3-8s)
```

## Key Functions

```typescript
// Output (lib/output.ts)
success<T>(cmd, data, startTime): CliOutput<T>
failure(cmd, code, msg, startTime): CliOutput<never>
emit<T>(result, json): void
toErrorMessage(err: unknown): string

// Guards (lib/guards.ts)
validateSource(source): void
validateToolName(name): void
rejectPathTraversal(path, label): void
shellQuote(s): string                  // canonical location

// Analysis (lib/analyzer.ts)
deepProbe(bin, {maxDepth}): {tree, totalCommands}
detectInteractionMode(cmds, flags, help?): "repl"|"subcommand"|"single"
smokeTest(tool, installDir, cachedBin?): SmokeTestResult

// Skills — lib/skills/* modules
parseFrontmatter(content): SkillFrontmatter | null      // frontmatter.ts
discoverResources(skillDir): SkillResources             // frontmatter.ts
computeIntegrity(uri, version): string                  // lockfile.ts
writeLockfile(path, tools): void                        // lockfile.ts
buildDescription(tool): string                          // description.ts (Tool)
buildShortDescription(entry): string                    // skill-content.ts (ManifestEntry)
detectToolLanguage(tool): ToolLanguage                  // description.ts
isLikelyCli(tool): boolean                              // description.ts
installTool(source, dataDir, opts): Promise<Tool>       // lifecycle.ts
listSkills(dataDir): InstalledSkillMeta[]               // lifecycle.ts
generateRichSkillMd(tool): string                       // generators.ts
generateSkillDirectory(tool): SkillDirectory            // generators.ts
generateInstallScript(tool): string                     // generators.ts

// Quality (lib/skill-tester.ts)
testSkillSync(path, preloaded?): SkillTestResult
scoreTrigger(description): number
scoreContentQuality(skillMd): {score, issues}

// Classifiers (all: query?, limit?) → Promise<ExtendedManifestEntry[]>
discoverNpmPackages / discoverGitHubRepos / discoverCratesPackages / discoverPyPIPackages

// Extractor (lib/extractor.ts)
extractReadmeSections(readme, maxChars?): ReadmeSections
inferBinaryNames(repoDir): string[]
readSourceVersion(repoDir): string | undefined

// Curated (lib/curated-tools.ts)
loadAllTools(projectRoot): CliTool[]   // loads examples/data/ai-ml-tools.json
GENERAL_TOOLS: CliTool[]

// Indexes (lib/indexes.ts)
groupByDomain(entries): Map<string, ManifestEntry[]>
generateMasterIndex(manifest, triggers): string

// Clerk Auth (lib/companion/clerk-auth.ts) — canonical @clerk/backend import location
verifyClerkToken(req: IncomingMessage, config: ClerkConfig): Promise<ClerkSession | null>
updateUserMetadata(userId, metadata, config: ClerkConfig): Promise<void>
// ClerkSession: { userId, sessionId, email?, publicMetadata }
// ClerkConfig: { secretKey, publishableKey? }
```

## Data Directory

```
~/.agents-cli/tools.json              — metadata store
~/.agents-cli/tools/<id>/package/     — installed files
~/.agents-cli/tools/<id>/CONTEXT.md   — auto-docs
~/.agents-cli/skills/<name>/skill.json + CONTEXT.md
```

## Common Pitfalls

- `shellQuote` canonical location is `lib/guards.ts` — import from `./guards.js` in new code
- `buildDescription(tool)` in `lib/skills/description.ts` takes `Tool`; `buildShortDescription(entry)` in `lib/skill-content.ts` takes `ManifestEntry` — they are different functions
- `ai-ml-tools.json` is at `examples/data/` (not project root)
- SaaS UI is at `examples/saas-ui/` (not root `saas-ui/`)
- `loadAllTools(projectRoot)` needs project root path, not data dir
- Bare tool names (e.g. `ruff`) don't match FORMAT_PATTERNS — need `pypi:` prefix
- `IntentResult` has `.intent` (not `.type`); `ExtractedEntity` has `.packageName` (not `.packages`)
- `ToolCapabilities.commands` is `readonly` — use spread
- Cache treats `repoSha: "unknown"` as miss (PyPI installs never get stale-hit)
- Linter hook may auto-add imports or revert changes — re-read files after edits
- SaaS UI `searchFilters` must NOT be in localStorage `persistKeys` — stale filter state (e.g. `productType:"agent-def"`) across sessions causes 0 products in all marketplace tabs
- SaaS UI Vercel: deploy from `examples/saas-ui/` dir (linked to `saas-ui` project). Do NOT deploy from repo root — rootDirectory is not configured on `agents-cli-saas` project
- `AgentsApi.baseUrl` (not `._base`) is the correct field name for the API base URL
- `clerkPublishableKey: null` in `/api/config` means `CLERK_SECRET_KEY` not loaded — check `.env` is populated and `skill-forge.ts --companion --serve` was restarted after editing `.env`
- Clerk `publicMetadata` comes from `clerk.users.getUser(userId).publicMetadata` (not session claims `public_metadata`)
- `STRIPE_WEBHOOK_SECRET` wrong format (`sk_test_...` instead of `whsec_...`) causes all webhook verifications to fail silently

## Do NOT

- Add `yaml`/`js-yaml` (custom frontmatter parser in `lib/skills/frontmatter.ts`)
- Skip build, remove security guards, use `process.exit()`, add interactive prompts
- Bypass `CliOutput<T>`, hardcode `dryRun: false`, use bare `console.error` with `--json`
- Add HTTP helpers without SSRF checks, use `require()`, use magic numbers
- Match frontmatter with full-content regex — use `parseFrontmatter()`
- Fabricate CLI subcommands not present in actual `--help`
- Use same trigger text for different categories; suggest wrong package managers
- Write files outside output dir; interpolate unsanitized input into shell
- Import `shellQuote` from `lib/skills.ts` in new code — use `lib/guards.ts`
- Import `@clerk/backend` directly in new files — use `lib/companion/clerk-auth.ts` as the canonical import location
- Use raw fetch for Stripe API calls — `StripeProvider` in `lib/companion/billing.ts` uses the official `stripe` npm SDK
- Set `STRIPE_WEBHOOK_SECRET` to a `sk_test_...` key — it must be `whsec_...` from `stripe listen` or the Dashboard

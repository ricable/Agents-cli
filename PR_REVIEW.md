# PR Review: agents-cli Foundation (All 7 Phases)

## Review Summary

**120 tests passing** across 10 suites. TypeScript compiles cleanly. Build succeeds.
However, this review identified **3 critical**, **6 high**, and **9 medium** severity issues that should be addressed before merge.

---

## CRITICAL Issues

### 1. Command Injection in `installer.ts` via `execSync`

**Files:** `lib/installer.ts:97,100,150,168,206`

All `execSync` calls interpolate user-controlled strings into shell commands using double quotes. An attacker who controls `source.uri` (repo names, npm package names, local paths) can inject arbitrary shell commands.

```typescript
// Line 97 — dest derived from user input
execSync(`tar -xzf "${tmpFile}" --strip-components=1 -C "${dest}"`, { stdio: "pipe" });
// Line 150 — pkg is raw user input
execSync(`npm pack "${pkg}"`, { cwd: tmpDir, ... });
// Line 206 — srcPath from source.uri after ~ expansion
execSync(`cp -r "${srcPath}/." "${dest}/"`, { stdio: "pipe" });
```

**Fix:** Replace all `execSync(string)` with `execFileSync(binary, argsArray)` which bypasses the shell entirely:
```typescript
execFileSync("tar", ["-xzf", tmpFile, "--strip-components=1", "-C", dest], { stdio: "pipe" });
execFileSync("npm", ["pack", pkg], { cwd: tmpDir, stdio: "pipe" });
```

### 2. Command Injection in `analyzer.ts` via `execSync`

**File:** `lib/analyzer.ts:10`

```typescript
execSync(`"${binPath}" ${flag} 2>&1`, { timeout, ... });
```

`binPath` is a file path from the tool installation directory. A malicious tool with crafted filenames (containing `$(...)` or backticks) can execute arbitrary commands during the analysis phase.

**Fix:** Use `execFileSync`:
```typescript
execFileSync(binPath, [flag], { timeout, stdio: ["pipe", "pipe", "pipe"], encoding: "utf-8" });
```

### 3. `@vitest/coverage-v8` missing — CI will fail

**Files:** `package.json`, `vitest.config.ts:8`, `.github/workflows/ci.yml:24`

`vitest.config.ts` specifies `coverage.provider: "v8"`, CI runs `npm run test:coverage`, but `@vitest/coverage-v8` is not in `devDependencies`. Every CI run will fail.

**Fix:**
```bash
npm install -D @vitest/coverage-v8
```

---

## HIGH Issues

### 4. Path Traversal in `store.ts`

**File:** `lib/store.ts:133-134,144,159-160`

Tool IDs are used directly as directory names without sanitization:
```typescript
join(toolsDir, tool.id)  // If tool.id is "../../etc" → writes outside data dir
```
`store.remove()` calls `rmSync(..., { recursive: true })` with the unsanitized path.

**Fix:** Validate tool IDs: `/^[a-zA-Z0-9_@./-]+$/` and reject any containing `..`:
```typescript
function validateToolId(id: string): void {
  if (id.includes("..") || /[^a-zA-Z0-9_@.\/-]/.test(id)) {
    throw new Error(`Invalid tool ID: ${id}`);
  }
}
```

### 5. Unbounded HTTP Redirect Following (SSRF risk)

**Files:** `lib/resolver.ts:33`, `lib/installer.ts:22`

Both `fetchJson` and `downloadFile` follow HTTP redirects recursively with no limit. A malicious server can cause infinite recursion (stack overflow) or redirect to internal network addresses (SSRF to `169.254.169.254`, `127.0.0.1`, etc.).

**Fix:** Add a `maxRedirects` counter (default 10) and reject redirects to private IP ranges.

### 6. No Download Size Limits

**Files:** `lib/installer.ts:17-36`, `lib/resolver.ts:28-49`

Neither `downloadFile` nor `fetchJson` enforce size limits. A malicious source can serve an arbitrarily large response, causing disk or memory exhaustion.

**Fix:** Check `Content-Length` header and enforce a maximum (e.g., 500MB for tarballs, 1MB for JSON metadata). Abort streams that exceed the limit.

### 7. `agent-run` Binary Built But Not Declared in `package.json`

**Files:** `tsup.config.ts:7`, `package.json`

`tsup.config.ts` builds `bin/agent-run` to `dist/bin/agent-run.js`, but `package.json` `"bin"` only declares `agents-cli`. The `agent-run` binary is unreachable after `npm install`.

**Fix:**
```json
"bin": {
  "agents-cli": "./dist/bin/agents-cli.js",
  "agent-run": "./dist/bin/agent-run.js"
}
```

### 8. `parseFlag` Name/Description Swap Bug

**File:** `lib/analyzer.ts:37-38`

For flags matched by the second regex (long-flag-only), `m[2]` contains the description but line 37 sets `name = m[2] ?? m[1]`, using the description as the flag name when a description exists.

**Fix:** Reorder to `name = m[1] ?? ""` and `description = (m[3] ?? m[2] ?? "").trim()` — or restructure with named capture groups.

### 9. `__dirname` in ESM Context (`mcp.ts`)

**File:** `lib/mcp.ts:222`

`createMcpConfig` uses `__dirname`, but the project uses ESM modules. In native ESM, `__dirname` is not defined and will throw `ReferenceError`. (Note: `tsup` shims this, so it works in the built output, but not if the source is imported directly.)

---

## MEDIUM Issues

### 10. `pypi`, `tarball`, `url`, `git` Formats Declared But Unsupported

**Files:** `lib/types.ts:9`, `lib/resolver.ts`, `lib/installer.ts:221-223`

`SourceFormat` declares 7 formats, but only `github`, `npm`, and `local` are fully supported end-to-end. `pypi` has no detection pattern. `tarball`, `url`, `git` are detectable by the resolver but the installer throws "Unsupported format" for all of them.

**Fix:** Either implement support or remove from `SourceFormat` type and document planned formats separately.

### 11. npm Scoped Package URL Encoding

**File:** `lib/resolver.ts:93`

```typescript
encodeURIComponent(pkg).replace("%40", "@")
```

Leaves `/` encoded as `%2F` for scoped packages. While npm registry accepts this format, it's fragile. Consider using the npm-standard encoding.

### 12. Store Race Condition (No File Locking)

**File:** `lib/store.ts`

Every operation reads the full JSON, modifies in memory, writes back. Concurrent CLI processes (parallel `agents-cli add`) will silently lose data. `installSkill` calls `store.save()` in a loop, making this likely.

**Fix:** Use file-level advisory locking (e.g., `proper-lockfile` package) or atomic write pattern.

### 13. GitHub Regex Mismatch in `installFromGithub`

**File:** `lib/installer.ts:81`

```typescript
/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/.exec(source.uri)
```

For a URL like `https://github.com/owner/repo`, this matches the wrong segments (e.g., `https:` prefix). The resolver's `parseGithubOwnerRepo` handles this correctly, but `installFromGithub` reimplements it with a broken regex.

**Fix:** Reuse `parseGithubOwnerRepo` from resolver, or fix the regex to anchor properly.

### 14. MCP Bridge `sendRequest` Has No Timeout

**File:** `lib/mcp.ts:166-189`

If the MCP server never responds to a request, the promise hangs forever. `listTools()` and `callTool()` will block indefinitely.

**Fix:** Add a configurable timeout (default 30s) to `sendRequest`.

### 15. CI Quality Job Threshold Check is a No-Op

**File:** `.github/workflows/ci.yml:39`

```yaml
run: npx vitest run --coverage 2>&1 | grep -E "Lines|Statements" || true
```

The `|| true` means this step always passes. Coverage thresholds are never enforced.

**Fix:** Remove `|| true`. Vitest already exits non-zero when thresholds fail.

### 16. Temporary Files Not Cleaned Up on Error

**File:** `lib/installer.ts:90-100`

If `tar` extraction fails, the downloaded tarball at `tmpFile` is never cleaned up. Same in `installFromNpm`.

**Fix:** Wrap in try/finally to ensure cleanup.

### 17. `update` Command Doesn't Re-Analyze

**File:** `bin/agents-cli.ts:456-462`

The `update` command reinstalls but doesn't re-run the analyzer or update the version in metadata. After updating, the stored version/capabilities remain stale.

### 18. `publish` Always Throws

**File:** `lib/registry.ts:160-163`

`publish()` is declared in the `ToolRegistry` interface but always throws "not yet implemented". Any caller gets a runtime error.

---

## Test Coverage Gaps

1. **No test for command injection defense** — `guards.test.ts` only tests `detectFormat()`, not actual security enforcement in installer/analyzer
2. **No test for `runTool` timeout behavior** — the timeout + kill path is untested
3. **No test for concurrent store operations** — race condition is untested
4. **No test for `installSkill` with network sources** — only local fixtures tested
5. **No integrity verification test** — lockfile `integrity` hashes are computed but never verified on install

---

## Proposed Fix Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| P0 | #1 Command injection in installer (CRITICAL) | 1h |
| P0 | #2 Command injection in analyzer (CRITICAL) | 30m |
| P0 | #3 Missing `@vitest/coverage-v8` dep (CRITICAL) | 5m |
| P1 | #4 Path traversal in store | 30m |
| P1 | #5 Unbounded redirects / SSRF | 1h |
| P1 | #6 No download size limits | 1h |
| P1 | #7 Missing `agent-run` bin entry | 5m |
| P1 | #8 parseFlag name/description swap | 15m |
| P2 | #10-18 Medium issues | 4-6h |

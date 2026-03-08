# PR #2 Review: Remaining Gaps and Critical Issues

## Review of `fix: address all remaining PR review findings (#5-18)`

The fixes in this PR address the previously identified issues, but a thorough re-review of the full codebase reveals **3 critical**, **3 high**, and **5 medium** severity issues that remain.

---

## CRITICAL

### 1. `NaN` Bypasses Size Limits (resolver.ts:74, installer.ts:43)

Both `fetchJson` and `downloadFile` parse `Content-Length` with `parseInt()`, but when the header is missing or malformed, `parseInt` returns `NaN`. Since `NaN > MAX_SIZE` is always `false`, the size check is silently bypassed — allowing unbounded downloads/responses.

```typescript
// Current (broken)
const contentLength = parseInt(res.headers["content-length"] ?? "", 10);
if (contentLength > MAX_JSON_SIZE) { ... }

// Fix
const contentLength = parseInt(res.headers["content-length"] ?? "", 10);
if (!isNaN(contentLength) && contentLength > MAX_JSON_SIZE) { ... }
// The streaming check still enforces the limit, but the early exit is a no-op
```

**Impact**: The Content-Length early-exit never fires for servers that omit the header. The streaming `received` counter still catches it, but only after buffering begins.

### 2. Missing `return` After `reject()` in Download Stream Handler (installer.ts:52-57)

When `received > MAX_DOWNLOAD_SIZE`, `reject()` is called but execution continues — `res.pipe(stream)` keeps writing data. The promise may reject AND resolve, causing undefined behavior.

```typescript
// Current (broken)
res.on("data", (chunk: Buffer) => {
  received += chunk.length;
  if (received > MAX_DOWNLOAD_SIZE) {
    res.destroy();
    stream.destroy();
    reject(new Error(`Download exceeded size limit`));
    // ← no return, data handler continues on next chunk before destroy takes effect
  }
});
res.pipe(stream); // ← stream.on("finish") can still fire → resolve() after reject()
```

**Fix**: Add `return` after `reject()`, and guard `stream.on("finish")` to only resolve if not already settled.

### 3. TOCTOU Race in npm Pack Tarball Lookup (installer.ts:164-173)

After `npm pack`, the code scans `tmpdir()` for tarballs matching the package name pattern. Between `npm pack` completing and `readdirSync`, another process could place a malicious tarball with a matching name. This is a classic TOCTOU vulnerability in a shared `/tmp` directory.

```typescript
const safeName = pkg.replace(/^@/, "").replace(/\//g, "-");
const tmpFiles = readdirSync(tmpdir()).filter(
  (f) => f.startsWith(safeName) && f.endsWith(".tgz"),
);
```

**Fix**: Use `--pack-destination` with a unique temporary directory (already partially done — just switch from `tmpdir()` to a unique subdirectory).

---

## HIGH

### 4. Path Traversal via `package.json` bin/main Fields (analyzer.ts:118-130)

`findMainBinary()` reads `bin` and `main` fields from untrusted `package.json` and constructs paths with `join()`. A malicious package can specify `"bin": "../../.bashrc"` to escape the tool directory. The resolved path is never validated against the tool directory boundary.

```typescript
// Current
const binField = pkg.bin;
if (typeof binField === "string") {
  const resolved = join(toolDir, binField);
  // ← no check that resolved is still within toolDir
```

**Fix**: After `join()`, verify `resolved.startsWith(toolDir + "/")`.

### 5. No SIGKILL Fallback in MCP Server Stop (mcp.ts:98-110)

`stopServer()` sends `SIGTERM` but never checks if the process actually exits. If the child ignores SIGTERM, it becomes a zombie. Over time, this leaks PIDs and file descriptors.

**Fix**: Set a 5-second timeout after SIGTERM; if still alive, send SIGKILL.

### 6. Intermediate Redirect URLs Not Validated for SSRF (resolver.ts:65-66)

The SSRF check validates the initial URL, but `res.headers.location` (the redirect target) is passed directly to the recursive call. While the recursive call will check the redirect URL, if the redirect is to a `data:` or `javascript:` URI scheme, `isPrivateUrl` won't catch it (it only checks IP ranges).

**Fix**: Validate redirect URLs are HTTP/HTTPS before following.

---

## MEDIUM

### 7. Concurrent `store.save()` Causes Data Loss (store.ts:93-98)

Atomic write (tmp+rename) prevents corruption but not lost updates. Two concurrent `save()` calls both call `loadTools()`, each gets the same snapshot, each writes their single change — the second write silently drops the first's data.

**Fix**: Read-modify-write should be serialized with a file lock, or use compare-and-swap via file modification timestamps.

### 8. `generateContextMd` Vulnerable to Markdown Injection (store.ts:16-66)

Tool metadata (name, description, tags, homepage) from untrusted sources is embedded directly into markdown without escaping. A tool with `description: "[click](javascript:alert(1))"` injects arbitrary markdown/links into generated CONTEXT.md files consumed by LLMs.

### 9. Empty Catch Blocks Hide Critical Failures (multiple files)

At least 15 empty `catch {}` blocks across the codebase silently swallow errors. Key examples:
- `installer.ts:122` — `npm install` failure is silenced (dependencies may be missing)
- `analyzer.ts:133` — binary analysis failure is silenced
- `agents-cli.ts:469,516` — update re-analysis failure is silenced

### 10. No Integrity Verification on Install (installer.ts, skills.ts)

The lockfile stores `integrity` hashes, but `installFromGithub` and `installFromNpm` never verify downloaded content against these hashes. The integrity field is write-only — computed on freeze but never checked on install.

### 11. Missing Test Coverage for Security Boundaries

No tests exist for:
- SSRF private IP blocking (`isPrivateUrl`)
- Download size limit enforcement
- MCP request timeout behavior
- Path traversal prevention in `findMainBinary`
- Concurrent store operations
- Malformed Content-Length handling

---

## Summary

| # | Issue | Severity | File | Type |
|---|-------|----------|------|------|
| 1 | NaN bypasses Content-Length size check | CRITICAL | resolver.ts, installer.ts | Security bypass |
| 2 | Missing return after reject in stream handler | CRITICAL | installer.ts | Logic error |
| 3 | TOCTOU race in npm pack tarball lookup | CRITICAL | installer.ts | Race condition |
| 4 | Path traversal via package.json fields | HIGH | analyzer.ts | Security |
| 5 | No SIGKILL fallback for zombie processes | HIGH | mcp.ts | Resource leak |
| 6 | Redirect URIs not scheme-validated | HIGH | resolver.ts | SSRF |
| 7 | Concurrent store.save() drops writes | MEDIUM | store.ts | Data loss |
| 8 | Markdown injection in CONTEXT.md | MEDIUM | store.ts | Injection |
| 9 | Empty catch blocks hide failures | MEDIUM | Multiple | Debuggability |
| 10 | Integrity hashes never verified | MEDIUM | installer.ts | Design gap |
| 11 | Missing security boundary tests | MEDIUM | tests/ | Coverage gap |

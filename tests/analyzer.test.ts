import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createAnalyzer, findMainBinary, detectInteractionMode } from "../lib/analyzer.js";
import type { ToolCommand, ToolFlag } from "../lib/types.js";
import { mkdtempSync, writeFileSync, mkdirSync, chmodSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("findMainBinary", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-analyzer-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds binary from package.json bin field (string)", () => {
    writeFileSync(join(tmpDir, "package.json"), JSON.stringify({ bin: "./cli.js" }));
    writeFileSync(join(tmpDir, "cli.js"), "#!/usr/bin/env node\nconsole.log('hi')");
    expect(findMainBinary(tmpDir)).toBe(join(tmpDir, "cli.js"));
  });

  it("finds binary from package.json bin field (object)", () => {
    writeFileSync(join(tmpDir, "package.json"), JSON.stringify({ bin: { "my-tool": "./bin/run.js" } }));
    mkdirSync(join(tmpDir, "bin"));
    writeFileSync(join(tmpDir, "bin/run.js"), "#!/usr/bin/env node");
    expect(findMainBinary(tmpDir)).toBe(join(tmpDir, "bin/run.js"));
  });

  it("finds executable in bin/ directory", () => {
    mkdirSync(join(tmpDir, "bin"));
    const binPath = join(tmpDir, "bin", "mytool");
    writeFileSync(binPath, "#!/bin/bash\necho hello");
    chmodSync(binPath, 0o755);
    expect(findMainBinary(tmpDir)).toBe(binPath);
  });

  it("finds cli.js fallback", () => {
    writeFileSync(join(tmpDir, "cli.js"), "console.log('hi')");
    expect(findMainBinary(tmpDir)).toBe(join(tmpDir, "cli.js"));
  });

  it("returns null when nothing found", () => {
    expect(findMainBinary(tmpDir)).toBeNull();
  });
});

describe("createAnalyzer", () => {
  let tmpDir: string;
  const analyzer = createAnalyzer();

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-analyzer-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("parses help output from a simple script", async () => {
    const script = join(tmpDir, "tool.sh");
    writeFileSync(script, `#!/bin/bash
if [ "$1" = "--help" ]; then
  echo "Usage: tool [command] [options]"
  echo ""
  echo "Commands:"
  echo "  run          Run the main process"
  echo "  build        Build the project"
  echo ""
  echo "Options:"
  echo "  -v, --verbose    Enable verbose mode"
  echo "  -o, --output <file>  Output file"
  echo "  --dry-run        Dry run mode"
fi
`);
    chmodSync(script, 0o755);

    const result = await analyzer.analyze(script, { timeout: 5000 });
    expect(result.analysisMethod).toBe("flag-parse");
    expect(result.rawHelp).toContain("Usage: tool");
    expect(result.commands.length).toBeGreaterThanOrEqual(2);
    expect(result.globalFlags.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty capabilities for non-existent binary", async () => {
    const result = await analyzer.analyze("/nonexistent/binary", { timeout: 2000 });
    expect(result.commands).toHaveLength(0);
    expect(result.globalFlags).toHaveLength(0);
    expect(result.analysisMethod).toBe("help-probe");
  });

  it("detects interactionMode on analyzed tool", async () => {
    const script = join(tmpDir, "repl-tool.sh");
    writeFileSync(script, `#!/bin/bash
if [ "$1" = "--help" ]; then
  echo "Usage: repl-tool [command]"
  echo ""
  echo "Commands:"
  echo "  shell        Start interactive shell"
  echo "  run          Run a script"
fi
`);
    chmodSync(script, 0o755);

    const result = await analyzer.analyze(script, { timeout: 5000 });
    expect(result.interactionMode).toBe("repl");
  });
});

// ── detectInteractionMode ──────────────────────────────────────────────

describe("detectInteractionMode", () => {
  const cmd = (name: string): ToolCommand => ({ name, description: "", flags: [] });
  const flag = (name: string, alias?: string): ToolFlag => ({
    name, alias, description: "", type: "boolean", required: false,
  });

  it("returns 'repl' when commands include 'shell'", () => {
    expect(detectInteractionMode([cmd("shell"), cmd("run")], [])).toBe("repl");
  });

  it("returns 'repl' when commands include 'repl'", () => {
    expect(detectInteractionMode([cmd("repl")], [])).toBe("repl");
  });

  it("returns 'repl' when commands include 'console'", () => {
    expect(detectInteractionMode([cmd("console")], [])).toBe("repl");
  });

  it("returns 'repl' when commands include 'interactive'", () => {
    expect(detectInteractionMode([cmd("interactive")], [])).toBe("repl");
  });

  it("returns 'repl' when --interactive flag is present", () => {
    expect(detectInteractionMode([], [flag("--interactive")])).toBe("repl");
  });

  it("returns 'repl' when --repl flag is present", () => {
    expect(detectInteractionMode([], [flag("--repl")])).toBe("repl");
  });

  it("returns 'repl' when rawHelp mentions REPL", () => {
    expect(detectInteractionMode([], [], "Start the REPL for testing")).toBe("repl");
  });

  it("returns 'repl' when rawHelp mentions 'interactive mode'", () => {
    expect(detectInteractionMode([], [], "Use interactive mode for debugging")).toBe("repl");
  });

  it("does NOT false-positive on -i alias (e.g. grep -i)", () => {
    // -i is commonly used for case-insensitive, in-place, include-headers etc.
    expect(detectInteractionMode([], [flag("--ignore-case", "-i")])).toBe("single");
  });

  it("does NOT false-positive on -i alias for sed-style tools", () => {
    expect(detectInteractionMode(
      [cmd("replace")],
      [flag("--in-place", "-i")],
    )).toBe("subcommand");
  });

  it("returns 'subcommand' when commands exist but no REPL indicators", () => {
    expect(detectInteractionMode([cmd("build"), cmd("test")], [])).toBe("subcommand");
  });

  it("returns 'single' when no commands and no REPL indicators", () => {
    expect(detectInteractionMode([], [])).toBe("single");
  });

  it("returns 'single' when only flags exist (no commands, no REPL)", () => {
    expect(detectInteractionMode([], [flag("--verbose"), flag("--output")])).toBe("single");
  });

  it("is case-insensitive for command name matching", () => {
    expect(detectInteractionMode([cmd("Shell")], [])).toBe("repl");
    expect(detectInteractionMode([cmd("REPL")], [])).toBe("repl");
  });
});

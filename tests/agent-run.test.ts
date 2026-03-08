import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runTool } from "../bin/agent-run.js";
import { createStore, getToolInstallDir } from "../lib/store.js";
import { mkdtempSync, writeFileSync, mkdirSync, chmodSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Tool } from "../lib/types.js";

describe("runTool", () => {
  let tmpDir: string;
  let dataDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-run-"));
    dataDir = join(tmpDir, "data");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  async function installFixtureTool(name: string): Promise<string> {
    const store = createStore(dataDir);
    const installDir = getToolInstallDir(dataDir, name);
    mkdirSync(join(installDir, "bin"), { recursive: true });

    const script = `#!/usr/bin/env node
if (process.argv.includes('--help')) {
  console.log('Usage: ${name} [options]');
  process.exit(0);
}
console.log('Hello from ${name}');
console.log('Args: ' + process.argv.slice(2).join(' '));
`;
    const binPath = join(installDir, "bin", name);
    writeFileSync(binPath, script);
    chmodSync(binPath, 0o755);
    writeFileSync(
      join(installDir, "package.json"),
      JSON.stringify({ name, version: "1.0.0", bin: { [name]: `./bin/${name}` } }),
    );

    const tool: Tool = {
      id: name,
      meta: { name, version: "1.0.0", description: `Test tool ${name}`, tags: [] },
      source: { format: "local", uri: installDir },
      capabilities: { commands: [], globalFlags: [], analysisMethod: "help-probe" },
      installPath: installDir,
      status: "installed",
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await store.save(tool);
    return installDir;
  }

  it("returns error for non-existent tool", async () => {
    const result = await runTool("nonexistent", [], { dataDir });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("TOOL_NOT_FOUND");
  });

  it("runs a fixture tool successfully", async () => {
    await installFixtureTool("hello-tool");
    const result = await runTool("hello-tool", [], { dataDir, timeout: 5000 });
    expect(result.success).toBe(true);
    expect(result.data).toContain("Hello from hello-tool");
  });

  it("passes arguments to the tool", async () => {
    await installFixtureTool("arg-tool");
    const result = await runTool("arg-tool", ["--foo", "bar"], { dataDir, timeout: 5000 });
    expect(result.success).toBe(true);
    expect(result.data).toContain("--foo bar");
  });

  it("reports duration", async () => {
    await installFixtureTool("time-tool");
    const result = await runTool("time-tool", [], { dataDir, timeout: 5000 });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});

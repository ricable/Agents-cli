import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, chmodSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createResolver } from "../lib/resolver.js";
import { createInstaller } from "../lib/installer.js";
import { createAnalyzer, findMainBinary } from "../lib/analyzer.js";
import { createStore, getToolInstallDir } from "../lib/store.js";
import type { Tool } from "../lib/types.js";

describe("End-to-end pipeline", () => {
  let tmpDir: string;
  let fixtureDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-e2e-"));
    fixtureDir = join(tmpDir, "fixtures");
    mkdirSync(fixtureDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  /** Create a Node.js fixture tool */
  function createNodeFixture(name: string, opts: { commands?: string[]; flags?: string[] } = {}): string {
    const toolDir = join(fixtureDir, name);
    mkdirSync(join(toolDir, "bin"), { recursive: true });

    const commands = opts.commands ?? ["run", "build"];
    const flags = opts.flags ?? ["--verbose", "--output <file>"];

    const helpText = [
      `Usage: ${name} [command] [options]`,
      "",
      `A test tool called ${name}`,
      "",
      "Commands:",
      ...commands.map((c) => `  ${c.padEnd(20)}${c} the project`),
      "",
      "Options:",
      ...flags.map((f) => `  ${f.padEnd(20)}A flag option`),
    ].join("\n");

    // Create the CLI script
    const script = `#!/usr/bin/env node
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(${JSON.stringify(helpText)});
  process.exit(0);
}
console.log('${name} running');
`;
    writeFileSync(join(toolDir, "bin", name), script);
    chmodSync(join(toolDir, "bin", name), 0o755);

    // Create package.json
    writeFileSync(
      join(toolDir, "package.json"),
      JSON.stringify({
        name,
        version: "1.2.3",
        description: `A fixture tool: ${name}`,
        bin: { [name]: `./bin/${name}` },
        keywords: ["test", "fixture"],
      }),
    );

    return toolDir;
  }

  /** Create a Python fixture tool */
  function createPythonFixture(name: string): string {
    const toolDir = join(fixtureDir, name);
    mkdirSync(toolDir, { recursive: true });

    const script = `#!/usr/bin/env python3
import sys
if '--help' in sys.argv or '-h' in sys.argv:
    print("""Usage: ${name} [options]

A Python test tool

Options:
  -v, --verbose    Verbose output
  -q, --quiet      Quiet mode
""")
    sys.exit(0)
print("${name} running")
`;
    writeFileSync(join(toolDir, "cli.py"), script);
    chmodSync(join(toolDir, "cli.py"), 0o755);

    return toolDir;
  }

  it("full pipeline: resolve → install → analyze → store → list → describe (Node fixture)", async () => {
    const fixturePath = createNodeFixture("my-node-tool", {
      commands: ["serve", "deploy", "test"],
      flags: ["--port <number>", "--verbose", "--dry-run"],
    });

    const resolver = createResolver();
    const installer = createInstaller();
    const analyzer = createAnalyzer();
    const dataDir = join(tmpDir, "data");
    const store = createStore(dataDir);

    // 1. Resolve local source
    const source = fixturePath; // absolute path starts with /
    expect(resolver.supports(source)).toBe(true);
    const resolved = await resolver.resolve(source);
    expect(resolved.source.format).toBe("local");

    // 2. Install
    const toolId = "my-node-tool";
    const installDir = getToolInstallDir(dataDir, toolId);
    const installResult = await installer.install(resolved.source, installDir);
    expect(installResult.installPath).toBe(installDir);
    expect(existsSync(join(installDir, "package.json"))).toBe(true);

    // 3. Analyze
    const mainBin = findMainBinary(installDir);
    expect(mainBin).toBeTruthy();
    const capabilities = await analyzer.analyze(mainBin!);
    expect(capabilities.analysisMethod).toBe("flag-parse");
    expect(capabilities.commands.length).toBeGreaterThanOrEqual(2);
    expect(capabilities.globalFlags.length).toBeGreaterThanOrEqual(2);
    expect(capabilities.rawHelp).toContain("my-node-tool");

    // 4. Store
    const now = new Date().toISOString();
    const tool: Tool = {
      id: toolId,
      meta: {
        name: "my-node-tool",
        version: "1.2.3",
        description: "A fixture tool: my-node-tool",
        tags: ["test", "fixture"],
      },
      source: resolved.source,
      capabilities,
      installPath: installDir,
      status: "installed",
      installedAt: now,
      updatedAt: now,
    };
    await store.save(tool);

    // 5. List
    const list = await store.list();
    expect(list.total).toBe(1);
    expect(list.tools[0]?.meta.name).toBe("my-node-tool");

    // 6. Describe (CONTEXT.md)
    const contextPath = join(dataDir, "tools", toolId, "CONTEXT.md");
    expect(existsSync(contextPath)).toBe(true);
    const contextMd = readFileSync(contextPath, "utf-8");
    expect(contextMd).toContain("# my-node-tool");
    expect(contextMd).toContain("A fixture tool");
    expect(contextMd).toContain("## Commands");
    expect(contextMd).toContain("## Global Options");
    expect(contextMd).toContain("## Raw Help Output");

    // 7. Get by ID
    const retrieved = await store.get(toolId);
    expect(retrieved?.capabilities.commands.length).toBeGreaterThanOrEqual(2);

    // 8. Remove
    expect(await store.remove(toolId)).toBe(true);
    expect(await store.has(toolId)).toBe(false);
  });

  it("full pipeline: Python fixture tool", async () => {
    const fixturePath = createPythonFixture("py-tool");

    const installer = createInstaller();
    const analyzer = createAnalyzer();
    const dataDir = join(tmpDir, "data2");
    const store = createStore(dataDir);

    // Install from local
    const installDir = getToolInstallDir(dataDir, "py-tool");
    await installer.install({ format: "local", uri: fixturePath }, installDir);
    expect(existsSync(join(installDir, "cli.py"))).toBe(true);

    // Analyze
    const mainBin = findMainBinary(installDir);
    expect(mainBin).toBe(join(installDir, "cli.py"));
    const capabilities = await analyzer.analyze(mainBin!);
    expect(capabilities.rawHelp).toContain("Python test tool");
    expect(capabilities.globalFlags.length).toBeGreaterThanOrEqual(1);

    // Store and verify CONTEXT.md
    const tool: Tool = {
      id: "py-tool",
      meta: { name: "py-tool", version: "0.1.0", description: "A Python test tool", tags: ["python"] },
      source: { format: "local", uri: fixturePath },
      capabilities,
      installPath: installDir,
      status: "installed",
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await store.save(tool);

    const ctx = readFileSync(join(dataDir, "tools", "py-tool", "CONTEXT.md"), "utf-8");
    expect(ctx).toContain("# py-tool");
    expect(ctx).toContain("python");
  });

  it("installs multiple tools and lists/filters them", async () => {
    const dataDir = join(tmpDir, "data3");
    const store = createStore(dataDir);
    const installer = createInstaller();

    // Create and install 3 fixtures
    for (const name of ["tool-alpha", "tool-beta", "tool-gamma"]) {
      const fixturePath = createNodeFixture(name);
      const installDir = getToolInstallDir(dataDir, name);
      await installer.install({ format: "local", uri: fixturePath }, installDir);

      const tool: Tool = {
        id: name,
        meta: { name, version: "1.0.0", description: `Tool ${name}`, tags: [name.split("-")[1]!] },
        source: { format: "local", uri: fixturePath },
        capabilities: { commands: [], globalFlags: [], analysisMethod: "help-probe" },
        installPath: installDir,
        status: name === "tool-gamma" ? "failed" : "installed",
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await store.save(tool);
    }

    // List all
    const all = await store.list();
    expect(all.total).toBe(3);

    // Filter by status
    const installed = await store.list({ status: "installed" });
    expect(installed.total).toBe(2);

    // Filter by text
    const alpha = await store.list({ text: "alpha" });
    expect(alpha.total).toBe(1);

    // Filter by tags
    const beta = await store.list({ tags: ["beta"] });
    expect(beta.total).toBe(1);
  });
});

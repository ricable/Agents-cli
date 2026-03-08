import { Command } from "commander";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { createResolver } from "../lib/resolver.js";
import { createInstaller } from "../lib/installer.js";
import { createAnalyzer, findMainBinary } from "../lib/analyzer.js";
import { createStore, getToolInstallDir, generateContextMd } from "../lib/store.js";
import type { Tool, ToolMeta, ToolCapabilities } from "../lib/types.js";

const VERSION = "0.1.0";
const DATA_DIR = join(homedir(), ".agents-cli");

const program = new Command()
  .name("agents-cli")
  .description("Discover, install, and manage agent tools")
  .version(VERSION);

// ── add ──────────────────────────────────────────────────────────────────────
program
  .command("add <source>")
  .description("Install a tool from a source identifier")
  .option("-f, --force", "Force reinstall if already installed")
  .action(async (source: string, opts: { force?: boolean }) => {
    const resolver = createResolver();
    const installer = createInstaller();
    const analyzer = createAnalyzer();
    const store = createStore(DATA_DIR);

    // 1. Resolve
    if (!resolver.supports(source)) {
      console.error(`Unknown source format: ${source}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Resolving ${source}...`);
    const resolved = await resolver.resolve(source);
    const toolId = resolved.meta.name ?? source.replace(/[/@]/g, "-").replace(/^-/, "");
    console.log(`  → ${resolved.source.format}:${resolved.source.uri} (${toolId})`);

    // 2. Check if already installed
    if (!opts.force && await store.has(toolId)) {
      console.log(`Tool ${toolId} is already installed. Use --force to reinstall.`);
      return;
    }

    // 3. Install
    if (!installer.supports(resolved.source.format)) {
      console.error(`Install not supported for format: ${resolved.source.format}`);
      process.exitCode = 1;
      return;
    }

    const installDir = getToolInstallDir(DATA_DIR, toolId);
    console.log(`Installing to ${installDir}...`);

    try {
      const installResult = await installer.install(resolved.source, installDir);
      console.log(`  Installed in ${installResult.duration}ms (${installResult.binaries.length} binaries found)`);

      // 4. Analyze
      let capabilities: ToolCapabilities = { commands: [], globalFlags: [], analysisMethod: "help-probe" };
      const mainBin = findMainBinary(installDir);
      if (mainBin) {
        console.log(`Analyzing ${mainBin}...`);
        try {
          capabilities = await analyzer.analyze(mainBin);
          console.log(`  Found ${capabilities.commands.length} commands, ${capabilities.globalFlags.length} flags (${capabilities.analysisMethod})`);
        } catch {
          console.log("  Analysis failed, using defaults");
        }
      } else {
        console.log("  No main binary found, skipping analysis");
      }

      // 5. Build version from resolved meta or package.json
      let version = resolved.meta.version ?? "0.0.0";
      const pkgJsonPath = join(installDir, "package.json");
      if (existsSync(pkgJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as Record<string, unknown>;
          if (typeof pkg.version === "string") version = pkg.version;
        } catch { /* ignore */ }
      }

      // 6. Store
      const now = new Date().toISOString();
      const meta: ToolMeta = {
        name: resolved.meta.name ?? toolId,
        version,
        description: resolved.meta.description ?? "",
        homepage: resolved.meta.homepage,
        license: resolved.meta.license,
        tags: resolved.meta.tags ? [...resolved.meta.tags] : [],
      };

      const tool: Tool = {
        id: toolId,
        meta,
        source: resolved.source,
        capabilities,
        installPath: installDir,
        status: "installed",
        installedAt: now,
        updatedAt: now,
      };

      await store.save(tool);
      console.log(`\n✓ ${meta.name}@${meta.version} installed successfully`);
      if (capabilities.rawHelp) {
        console.log("  CONTEXT.md generated with help output");
      }
    } catch (err) {
      console.error(`Install failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
  });

// ── list ─────────────────────────────────────────────────────────────────────
program
  .command("list")
  .description("List installed tools")
  .option("-s, --status <status>", "Filter by status")
  .action(async (opts: { status?: string }) => {
    const store = createStore(DATA_DIR);
    const result = await store.list(
      opts.status ? { status: opts.status as "installed" } : undefined,
    );
    if (result.tools.length === 0) {
      console.log("No tools installed.");
      return;
    }
    console.log(`\n  Installed tools (${result.total}):\n`);
    for (const tool of result.tools) {
      const tags = tool.meta.tags.length > 0 ? ` [${tool.meta.tags.join(", ")}]` : "";
      console.log(`  ${tool.meta.name}@${tool.meta.version}  (${tool.source.format})${tags}`);
      if (tool.meta.description) {
        console.log(`    ${tool.meta.description}`);
      }
    }
    console.log();
  });

// ── describe ─────────────────────────────────────────────────────────────────
program
  .command("describe <name>")
  .description("Show detailed info about an installed tool")
  .action(async (name: string) => {
    const store = createStore(DATA_DIR);
    const tool = await store.get(name);
    if (!tool) {
      console.error(`Tool not found: ${name}`);
      process.exitCode = 1;
      return;
    }
    console.log(generateContextMd(tool));
  });

// ── remove ───────────────────────────────────────────────────────────────────
program
  .command("remove <name>")
  .description("Remove an installed tool")
  .action(async (name: string) => {
    const store = createStore(DATA_DIR);
    const removed = await store.remove(name);
    if (removed) {
      console.log(`Removed ${name}`);
    } else {
      console.error(`Tool not found: ${name}`);
      process.exitCode = 1;
    }
  });

program.parse();

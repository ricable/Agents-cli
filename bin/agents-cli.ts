import { Command } from "commander";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createResolver } from "../lib/resolver.js";
import { createInstaller } from "../lib/installer.js";
import { createAnalyzer, findMainBinary } from "../lib/analyzer.js";
import { createStore, getToolInstallDir, generateContextMd } from "../lib/store.js";
import { createRegistry } from "../lib/registry.js";
import { McpBridge, createMcpConfig } from "../lib/mcp.js";
import { runTool } from "./agent-run.js";
import {
  parseFrontmatter,
  buildContext,
  generateSkillMd,
  installSkill,
  writeLockfile,
  readLockfile,
} from "../lib/skills.js";
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

// ── skills ────────────────────────────────────────────────────────────────────
const skills = program
  .command("skills")
  .description("Manage skills (SKILL.md bundles of tools)");

skills
  .command("install <path>")
  .description("Install a skill from a SKILL.md file path")
  .action(async (skillPath: string) => {
    const resolved = resolve(skillPath);
    if (!existsSync(resolved)) {
      console.error(`SKILL.md not found: ${resolved}`);
      process.exitCode = 1;
      return;
    }

    try {
      console.log(`Installing skill from ${resolved}...`);
      const skill = await installSkill(resolved, DATA_DIR);
      console.log(`\nSkill "${skill.frontmatter.name}" installed successfully`);
      console.log(`  Version: ${skill.frontmatter.version}`);
      console.log(`  Ingredients: ${skill.ingredients.length}`);
      for (const tool of skill.ingredients) {
        console.log(`    - ${tool.meta.name}@${tool.meta.version}`);
      }
      console.log(`  Context: ${skill.contextPath}`);
    } catch (err) {
      console.error(`Skill install failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
  });

skills
  .command("generate <name>")
  .description("Scaffold a new SKILL.md file")
  .option("-d, --description <desc>", "Skill description", "A new skill")
  .action((name: string, opts: { description: string }) => {
    const content = generateSkillMd(name, opts.description);
    const outPath = resolve("SKILL.md");
    writeFileSync(outPath, content, "utf-8");
    console.log(`Generated ${outPath}`);
  });

skills
  .command("context <path>")
  .description("Build and display the assembled context for a skill")
  .action(async (skillPath: string) => {
    const resolved = resolve(skillPath);
    if (!existsSync(resolved)) {
      console.error(`SKILL.md not found: ${resolved}`);
      process.exitCode = 1;
      return;
    }

    const content = readFileSync(resolved, "utf-8");
    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
      console.error("Failed to parse SKILL.md frontmatter");
      process.exitCode = 1;
      return;
    }

    // Try to load existing installed tools from store
    const store = createStore(DATA_DIR);
    const tools: Tool[] = [];
    for (const ingredient of frontmatter.ingredients) {
      const toolId = ingredient.replace(/[/@]/g, "-").replace(/^-/, "");
      const tool = await store.get(toolId);
      if (tool) tools.push(tool);
    }

    const bodyMatch = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/.exec(content);
    const body = bodyMatch?.[1]?.trim() ?? "";

    const skill = {
      frontmatter,
      body,
      ingredients: tools,
      contextPath: join(DATA_DIR, "skills", frontmatter.name, "CONTEXT.md"),
    };

    console.log(buildContext(skill));
  });

// ── freeze ────────────────────────────────────────────────────────────────────
program
  .command("freeze")
  .description("Generate agentcli.lock from currently installed tools")
  .option("-o, --output <path>", "Output path for lockfile", "agentcli.lock")
  .action(async (opts: { output: string }) => {
    const store = createStore(DATA_DIR);
    const result = await store.list();
    if (result.tools.length === 0) {
      console.log("No tools installed. Nothing to freeze.");
      return;
    }

    const lockPath = resolve(opts.output);
    writeLockfile(lockPath, [...result.tools]);
    console.log(`Wrote ${lockPath} with ${result.tools.length} entries`);
  });

// ── install (from lockfile) ──────────────────────────────────────────────────
program
  .command("install")
  .description("Install all tools from agentcli.lock")
  .option("-l, --lockfile <path>", "Path to lockfile", "agentcli.lock")
  .action(async (opts: { lockfile: string }) => {
    const lockPath = resolve(opts.lockfile);
    const lockfile = readLockfile(lockPath);
    if (!lockfile) {
      console.error(`Could not read lockfile: ${lockPath}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Installing ${lockfile.entries.length} tools from ${lockPath}...`);
    const installer = createInstaller();
    const analyzer = createAnalyzer();
    const store = createStore(DATA_DIR);

    for (const entry of lockfile.entries) {
      console.log(`  Installing ${entry.id}@${entry.version}...`);
      try {
        const installDir = getToolInstallDir(DATA_DIR, entry.id);

        if (installer.supports(entry.source.format)) {
          await installer.install(entry.source, installDir);
        }

        let capabilities: ToolCapabilities = { commands: [], globalFlags: [], analysisMethod: "help-probe" };
        const mainBin = findMainBinary(installDir);
        if (mainBin) {
          try {
            capabilities = await analyzer.analyze(mainBin);
          } catch { /* use defaults */ }
        }

        const now = new Date().toISOString();
        const tool: Tool = {
          id: entry.id,
          meta: {
            name: entry.id,
            version: entry.version,
            description: "",
            tags: [],
          },
          source: entry.source,
          capabilities,
          installPath: installDir,
          status: "installed",
          installedAt: now,
          updatedAt: now,
        };

        await store.save(tool);
        console.log(`    Done`);
      } catch (err) {
        console.error(`    Failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log("Install complete.");
  });

// ── search ───────────────────────────────────────────────────────────────────
program
  .command("search <query>")
  .description("Search the registry cascade for tools")
  .option("-l, --limit <n>", "Max results", "20")
  .action(async (query: string, opts: { limit: string }) => {
    const store = createStore(DATA_DIR);
    const registry = createRegistry(store);
    const limit = parseInt(opts.limit, 10) || 20;

    console.log(`Searching for "${query}"...`);
    const results = await registry.search({ query, limit });
    if (results.length === 0) {
      console.log("No results found.");
      return;
    }

    console.log(`\n  Found ${results.length} results:\n`);
    for (const entry of results) {
      const badge = entry.layer === "local" ? " (installed)" : ` [${entry.layer}]`;
      console.log(`  ${entry.meta.name}@${entry.meta.version}${badge}`);
      if (entry.meta.description) {
        console.log(`    ${entry.meta.description}`);
      }
    }
    console.log();
  });

// ── scan ─────────────────────────────────────────────────────────────────────
program
  .command("scan <directory>")
  .description("Scan a directory for CLI tools and analyze them")
  .action(async (directory: string) => {
    const dir = resolve(directory);
    if (!existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      process.exitCode = 1;
      return;
    }

    const analyzer = createAnalyzer();
    const { readdirSync, statSync } = await import("node:fs");
    const entries = readdirSync(dir);

    console.log(`Scanning ${dir}...`);
    let found = 0;
    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        const st = statSync(full);
        if (st.isFile() && (st.mode & 0o111)) {
          const caps = await analyzer.analyze(full, { timeout: 5000 });
          found++;
          console.log(`\n  ${entry}`);
          console.log(`    Commands: ${caps.commands.length}, Flags: ${caps.globalFlags.length}`);
          if (caps.commands.length > 0) {
            console.log(`    ${caps.commands.map((c) => c.name).join(", ")}`);
          }
        }
      } catch { /* skip non-analyzable */ }
    }
    console.log(`\nFound ${found} tools.`);
  });

// ── info ─────────────────────────────────────────────────────────────────────
program
  .command("info <name>")
  .description("Show detailed info from registry (local or remote)")
  .action(async (name: string) => {
    const store = createStore(DATA_DIR);
    const registry = createRegistry(store);

    const entry = await registry.lookup(name);
    if (!entry) {
      console.error(`Not found in registry: ${name}`);
      process.exitCode = 1;
      return;
    }

    console.log(`\n  ${entry.meta.name}@${entry.meta.version} [${entry.layer}]`);
    console.log(`  ${entry.meta.description}`);
    console.log(`  Source: ${entry.source.format}:${entry.source.uri}`);
    if (entry.meta.homepage) console.log(`  Homepage: ${entry.meta.homepage}`);
    if (entry.meta.license) console.log(`  License: ${entry.meta.license}`);
    if (entry.meta.tags.length > 0) console.log(`  Tags: ${entry.meta.tags.join(", ")}`);
    console.log(`  Verified: ${entry.verified}`);
    console.log();
  });

// ── update ───────────────────────────────────────────────────────────────────
program
  .command("update [name]")
  .description("Update an installed tool to latest version")
  .action(async (name?: string) => {
    const store = createStore(DATA_DIR);

    if (name) {
      const tool = await store.get(name);
      if (!tool) {
        console.error(`Tool not found: ${name}`);
        process.exitCode = 1;
        return;
      }
      console.log(`Updating ${name}... (reinstalling from ${tool.source.format}:${tool.source.uri})`);
      // Re-add with force
      const resolver = createResolver();
      const installer = createInstaller();
      const analyzer = createAnalyzer();
      const resolved = await resolver.resolve(tool.source.uri);
      const installDir = getToolInstallDir(DATA_DIR, name);
      await installer.install(resolved.source, installDir, { force: true });

      // Re-analyze after update
      let capabilities = tool.capabilities;
      const mainBin = findMainBinary(installDir);
      if (mainBin) {
        try {
          capabilities = await analyzer.analyze(mainBin);
        } catch { /* keep existing capabilities */ }
      }

      // Update version from package.json if available
      let version = resolved.meta.version ?? tool.meta.version;
      const pkgJsonPath = join(installDir, "package.json");
      if (existsSync(pkgJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as Record<string, unknown>;
          if (typeof pkg.version === "string") version = pkg.version;
        } catch { /* ignore */ }
      }

      const now = new Date().toISOString();
      await store.save({
        ...tool,
        capabilities,
        meta: { ...tool.meta, version },
        updatedAt: now,
      });
      console.log(`Updated ${name}`);
    } else {
      const result = await store.list();
      const analyzer = createAnalyzer();
      console.log(`Updating all ${result.total} tools...`);
      for (const tool of result.tools) {
        try {
          console.log(`  Updating ${tool.meta.name}...`);
          const resolver = createResolver();
          const installer = createInstaller();
          if (installer.supports(tool.source.format)) {
            const resolved = await resolver.resolve(tool.source.uri);
            const installDir = getToolInstallDir(DATA_DIR, tool.id);
            await installer.install(resolved.source, installDir, { force: true });

            let capabilities = tool.capabilities;
            const mainBin = findMainBinary(installDir);
            if (mainBin) {
              try { capabilities = await analyzer.analyze(mainBin); } catch { /* keep existing */ }
            }

            let version = resolved.meta.version ?? tool.meta.version;
            const pkgJsonPath = join(installDir, "package.json");
            if (existsSync(pkgJsonPath)) {
              try {
                const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as Record<string, unknown>;
                if (typeof pkg.version === "string") version = pkg.version;
              } catch { /* ignore */ }
            }

            const now = new Date().toISOString();
            await store.save({ ...tool, capabilities, meta: { ...tool.meta, version }, updatedAt: now });
            console.log(`    Done`);
          } else {
            console.log(`    Skipped (unsupported format)`);
          }
        } catch (err) {
          console.error(`    Failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  });

// ── run ──────────────────────────────────────────────────────────────────────
program
  .command("run <tool> [args...]")
  .description("Run an installed tool")
  .option("--json", "Output as JSON")
  .option("--timeout <ms>", "Timeout in milliseconds", "30000")
  .action(async (tool: string, args: string[], opts: { json?: boolean; timeout: string }) => {
    const result = await runTool(tool, args, {
      timeout: parseInt(opts.timeout, 10),
      dataDir: DATA_DIR,
    });
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (result.success) {
      console.log(result.data);
    } else {
      console.error(`Error [${result.error?.code}]: ${result.error?.message}`);
      process.exitCode = 1;
    }
  });

// ── mcp ──────────────────────────────────────────────────────────────────────
const mcp = program
  .command("mcp")
  .description("MCP server management");

mcp
  .command("start")
  .description("Start the MCP server with all installed tool directories")
  .action(async () => {
    const store = createStore(DATA_DIR);
    const result = await store.list();
    const toolDirs = result.tools.map((t) => join(DATA_DIR, "tools", t.id));

    const config = createMcpConfig(toolDirs);
    const bridge = new McpBridge();
    bridge.startServer(config);
    console.log(`MCP server started with ${toolDirs.length} tool directories`);
    console.log("Press Ctrl+C to stop.");

    // Keep running until interrupted
    await new Promise<void>((res) => {
      process.on("SIGINT", () => { bridge.stopServer(); res(); });
      process.on("SIGTERM", () => { bridge.stopServer(); res(); });
    });
  });

mcp
  .command("list")
  .description("List tools available through MCP")
  .action(async () => {
    const store = createStore(DATA_DIR);
    const result = await store.list();
    const toolDirs = result.tools.map((t) => join(DATA_DIR, "tools", t.id));

    const config = createMcpConfig(toolDirs);
    const bridge = new McpBridge();
    bridge.startServer(config);

    try {
      const tools = await bridge.listTools();
      console.log(`\n  MCP tools (${tools.length}):\n`);
      for (const tool of tools) {
        console.log(`  ${tool.name}`);
        if (tool.description) console.log(`    ${tool.description}`);
      }
    } finally {
      bridge.stopServer();
    }
  });

// ── init ─────────────────────────────────────────────────────────────────────
program
  .command("init")
  .description("Initialize a new agents-cli project with SKILL.md")
  .option("-n, --name <name>", "Project name", "my-agent")
  .option("-d, --description <desc>", "Project description", "A new agent skill")
  .action((opts: { name: string; description: string }) => {
    const skillPath = resolve("SKILL.md");
    if (existsSync(skillPath)) {
      console.error("SKILL.md already exists in this directory.");
      process.exitCode = 1;
      return;
    }
    const content = generateSkillMd(opts.name, opts.description);
    writeFileSync(skillPath, content, "utf-8");
    console.log(`Initialized ${skillPath}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Edit SKILL.md to add your tool ingredients`);
    console.log(`  2. Run: agents-cli skills install SKILL.md`);
    console.log(`  3. Run: agents-cli freeze`);
  });

// ── verify ───────────────────────────────────────────────────────────────────
program
  .command("verify")
  .description("Verify installed tools match the lockfile")
  .option("-l, --lockfile <path>", "Path to lockfile", "agentcli.lock")
  .action(async (opts: { lockfile: string }) => {
    const lockPath = resolve(opts.lockfile);
    const lockfile = readLockfile(lockPath);
    if (!lockfile) {
      console.error(`Could not read lockfile: ${lockPath}`);
      process.exitCode = 1;
      return;
    }

    const store = createStore(DATA_DIR);
    let allOk = true;

    for (const entry of lockfile.entries) {
      const tool = await store.get(entry.id);
      if (!tool) {
        console.log(`  MISSING  ${entry.id}@${entry.version}`);
        allOk = false;
      } else if (tool.meta.version !== entry.version) {
        console.log(`  MISMATCH ${entry.id} (installed: ${tool.meta.version}, locked: ${entry.version})`);
        allOk = false;
      } else {
        console.log(`  OK       ${entry.id}@${entry.version}`);
      }
    }

    if (allOk) {
      console.log("\nAll tools verified.");
    } else {
      console.log("\nSome tools are missing or mismatched. Run: agents-cli install");
      process.exitCode = 1;
    }
  });

// ── publish ──────────────────────────────────────────────────────────────────
program
  .command("publish <name>")
  .description("Publish a tool to the community registry (placeholder)")
  .action(async (name: string) => {
    const store = createStore(DATA_DIR);
    const tool = await store.get(name);
    if (!tool) {
      console.error(`Tool not found: ${name}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Publishing ${name} to community registry...`);
    console.log("Community registry publishing is not yet available.");
    console.log("Contribution: add topic 'agents-cli' to your GitHub repo to be indexed.");
  });

program.parse();

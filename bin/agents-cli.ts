/**
 * agents-cli — package manager for AI agent tools.
 *
 * Design principles (from "Rewrite Your CLI for AI Agents"):
 *   1. Structured JSON output on every command (--json or OUTPUT_FORMAT=json)
 *   2. Schema introspection via `schema` command
 *   3. Context window discipline (--fields, NDJSON pagination)
 *   4. Input hardening against agent hallucinations
 *   5. Agent skills auto-generated on install
 *   6. Multi-surface: CLI + MCP from same source of truth
 *   7. --dry-run on all mutating operations
 */

import { Command } from "commander";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readPkgVersion } from "../lib/pkg-utils.js";
import { createResolver } from "../lib/resolver.js";
import { createInstaller } from "../lib/installer.js";
import { createAnalyzer, findMainBinary, deepProbe } from "../lib/analyzer.js";
import { createStore, getToolInstallDir, generateContextMd } from "../lib/store.js";
import { createRegistry } from "../lib/registry.js";
import { McpBridge, createMcpConfig } from "../lib/mcp.js";
import { runTool } from "./agent-run.js";
import { success, failure, emit, toErrorMessage } from "../lib/output.js";
import { validateSource, validateToolName, validateRunArgs, InputValidationError } from "../lib/guards.js";
import {
  parseFrontmatter,
  buildContext,
  generateSkillMd,
  generateRichSkillMd,
  installTool,
  installSkill,
  listSkills,
  removeSkill,
  writeLockfile,
  readLockfile,
} from "../lib/skills.js";
import type { Tool, ToolCapabilities, ToolSubcommand, ToolSchema, ManifestEntry } from "../lib/types.js";

const VERSION = "0.1.0";
const DATA_DIR = join(homedir(), ".agents-cli");

/** Detect JSON output mode: --json flag or OUTPUT_FORMAT=json env var */
function isJsonMode(opts: { json?: boolean }): boolean {
  return opts.json === true || process.env.OUTPUT_FORMAT === "json";
}

/** Pick fields from an object (context window discipline — only return what agent needs) */
function pickFields<T extends Record<string, unknown>>(obj: T, fields?: string): Partial<T> {
  if (!fields) return obj;
  const keys = fields.split(",").map(k => k.trim());
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key as keyof T];
  }
  return result as Partial<T>;
}

const program = new Command()
  .name("agents-cli")
  .description("Package manager for AI agent tools — discover, install, analyze, and expose CLI tools")
  .version(VERSION);

// ══════════════════════════════════════════════════════════════════════════════
// add — install a tool (mutating → supports --dry-run)
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("add <source>")
  .description("Install a tool from a source identifier (owner/repo, @scope/pkg, pypi:name, crates:name, or ./path)")
  .option("-f, --force", "Force reinstall if already installed")
  .option("--json", "Output as structured JSON")
  .option("--dry-run", "Show what would be installed without installing")
  .option("--deep", "Deep-probe subcommands recursively after install")
  .option("--no-skill", "Skip auto-generating SKILL.md after install")
  .action(async (source: string, opts: { force?: boolean; json?: boolean; dryRun?: boolean; deep?: boolean; skill?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try {
      validateSource(source);
    } catch (err) {
      const e = err as InputValidationError;
      const result = failure("add", e.code, e.message, start);
      if (json) { emit(result, true); return; }
      console.error(e.message);
      process.exitCode = 1;
      return;
    }

    const store = createStore(DATA_DIR);
    const resolver = createResolver();

    if (!resolver.supports(source)) {
      const result = failure("add", "UNKNOWN_FORMAT", `Unknown source format: ${source}`, start);
      emit(result, json);
      if (!json) console.error(result.error!.message);
      return;
    }

    try {
      const resolved = await resolver.resolve(source);
      const toolId = resolved.meta.name ?? source.replace(/[/@]/g, "-").replace(/^-/, "");

      // ── dry-run: show what would happen, don't install ──
      if (opts.dryRun) {
        const dryResult = {
          action: "install",
          source: resolved.source,
          toolId,
          installPath: getToolInstallDir(DATA_DIR, toolId),
          meta: resolved.meta,
          alreadyInstalled: await store.has(toolId),
        };
        if (json) {
          emit(success("add", dryResult, start), true);
        } else {
          console.log(`Would install: ${source}`);
          console.log(`  Source: ${resolved.source.format}:${resolved.source.uri}`);
          console.log(`  Tool ID: ${toolId}`);
          console.log(`  Path: ${dryResult.installPath}`);
          console.log(`  Already installed: ${dryResult.alreadyInstalled}`);
        }
        return;
      }

      if (!opts.force && await store.has(toolId)) {
        if (json) {
          emit(success("add", { toolId, alreadyInstalled: true, message: "Use --force to reinstall" }, start), true);
        } else {
          console.log(`Tool ${toolId} is already installed. Use --force to reinstall.`);
        }
        return;
      }

      if (!json) {
        console.log(`Resolving ${source}...`);
        console.log(`  → ${resolved.source.format}:${resolved.source.uri} (${toolId})`);
      }

      const tool = await installTool(source, DATA_DIR, {
        store,
        verbose: !json,
        recursive: opts.deep,
      });

      // Always auto-generate rich SKILL.md (use --no-skill to skip)
      let skillPath: string | undefined;
      if (opts.skill !== false) {
        const skillContent = generateRichSkillMd(tool);
        const skillDir = join(DATA_DIR, "tools", tool.id, "skill");
        const { mkdirSync } = await import("node:fs");
        mkdirSync(skillDir, { recursive: true });
        skillPath = join(skillDir, "SKILL.md");
        writeFileSync(skillPath, skillContent, "utf-8");
        if (!json) console.log(`  SKILL.md generated: ${skillPath}`);
      }

      if (json) {
        emit(success("add", { tool, skillPath }, start), true);
      } else {
        console.log(`\n✓ ${tool.meta.name}@${tool.meta.version} installed`);
        console.log(`  ${tool.capabilities.commands.length} commands, ${tool.capabilities.globalFlags.length} flags discovered`);
        if (tool.capabilities.rawHelp) console.log("  CONTEXT.md generated with help output");
      }
    } catch (err) {
      const msg = toErrorMessage(err);
      const result = failure("add", "INSTALL_FAILED", msg, start);
      emit(result, json);
      if (!json) { console.error(`Install failed: ${msg}`); process.exitCode = 1; }
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// list — list installed tools
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("list")
  .description("List installed tools")
  .option("-s, --status <status>", "Filter by status")
  .option("--json", "Output as structured JSON")
  .option("--fields <fields>", "Comma-separated fields to include (context window discipline)")
  .action(async (opts: { status?: string; json?: boolean; fields?: string }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const store = createStore(DATA_DIR);

    const result = await store.list(
      opts.status ? { status: opts.status as "installed" } : undefined,
    );

    if (json) {
      const tools = result.tools.map(t => pickFields(t as unknown as Record<string, unknown>, opts.fields));
      emit(success("list", { tools, total: result.total }, start), true);
      return;
    }

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

// ══════════════════════════════════════════════════════════════════════════════
// describe — show detailed info about a tool
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("describe <name>")
  .description("Show detailed info about an installed tool")
  .option("--json", "Output as structured JSON (full tool object)")
  .option("--fields <fields>", "Comma-separated fields to include")
  .action(async (name: string, opts: { json?: boolean; fields?: string }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try { validateToolName(name); } catch (err) {
      const e = err as InputValidationError;
      emit(failure("describe", e.code, e.message, start), json);
      return;
    }

    const store = createStore(DATA_DIR);
    const tool = await store.get(name);
    if (!tool) {
      const result = failure("describe", "NOT_FOUND", `Tool not found: ${name}`, start);
      emit(result, json);
      if (!json) console.error(result.error!.message);
      return;
    }

    if (json) {
      const data = pickFields(tool as unknown as Record<string, unknown>, opts.fields);
      emit(success("describe", data, start), true);
    } else {
      console.log(generateContextMd(tool));
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// schema — introspect a tool's full command surface (agent-first discovery)
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("schema <name>")
  .description("Introspect the full command schema for an installed tool (machine-readable)")
  .option("--json", "Output as structured JSON")
  .option("--depth <n>", "Max recursion depth for subcommand discovery", "3")
  .option("--refresh", "Re-analyze the tool (ignore cached capabilities)")
  .action(async (name: string, opts: { json?: boolean; depth: string; refresh?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const maxDepth = parseInt(opts.depth, 10) || 3;

    try { validateToolName(name); } catch (err) {
      const e = err as InputValidationError;
      emit(failure("schema", e.code, e.message, start), json);
      return;
    }

    const store = createStore(DATA_DIR);
    const tool = await store.get(name);
    if (!tool) {
      const result = failure("schema", "NOT_FOUND", `Tool not found: ${name}`, start);
      emit(result, json);
      if (!json) console.error(result.error!.message);
      return;
    }

    const mainBin = findMainBinary(tool.installPath, tool.meta.name);
    if (!mainBin) {
      const result = failure("schema", "NO_BINARY", `No executable found in: ${tool.installPath}`, start);
      emit(result, json);
      if (!json) console.error(result.error!.message);
      return;
    }

    // Deep probe the command tree
    if (!json) console.log(`Probing ${name} to depth ${maxDepth}...`);
    const { tree, totalCommands } = deepProbe(mainBin, { maxDepth, timeout: 10000 });

    // Also get global flags from top-level help
    const analyzer = createAnalyzer();
    const caps = await analyzer.analyze(mainBin, { timeout: 10000 });

    const schema: ToolSchema = {
      name: tool.meta.name,
      version: tool.meta.version,
      description: tool.meta.description,
      binary: mainBin,
      globalFlags: caps.globalFlags,
      commands: tree,
      totalCommands,
      maxDepthProbed: maxDepth,
    };

    if (json) {
      emit(success("schema", schema, start), true);
    } else {
      console.log(`\n${schema.name}@${schema.version}`);
      console.log(`${schema.description}`);
      console.log(`Binary: ${schema.binary}`);
      console.log(`Total commands: ${schema.totalCommands} (depth ${maxDepth})\n`);

      if (schema.globalFlags.length > 0) {
        console.log("Global flags:");
        for (const f of schema.globalFlags) {
          const alias = f.alias ? ` (${f.alias})` : "";
          console.log(`  ${f.name}${alias}  ${f.description}`);
        }
        console.log();
      }

      // Print command tree
      function printTree(subs: readonly ToolSubcommand[], indent = ""): void {
        for (const sub of subs) {
          const flagCount = sub.flags.length > 0 ? ` [${sub.flags.length} flags]` : "";
          console.log(`${indent}${sub.name}  ${sub.description}${flagCount}`);
          if (sub.subcommands.length > 0) {
            printTree(sub.subcommands, indent + "  ");
          }
        }
      }
      if (tree.length > 0) {
        console.log("Commands:");
        printTree(tree, "  ");
      } else {
        console.log("No subcommands discovered.");
      }
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// remove — remove a tool (mutating → supports --dry-run)
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("remove <name>")
  .description("Remove an installed tool")
  .option("--json", "Output as structured JSON")
  .option("--dry-run", "Show what would be removed without removing")
  .action(async (name: string, opts: { json?: boolean; dryRun?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try { validateToolName(name); } catch (err) {
      const e = err as InputValidationError;
      emit(failure("remove", e.code, e.message, start), json);
      return;
    }

    const store = createStore(DATA_DIR);

    if (opts.dryRun) {
      const exists = await store.has(name);
      const data = { action: "remove", name, exists };
      if (json) { emit(success("remove", data, start), true); }
      else { console.log(`Would remove: ${name} (exists: ${exists})`); }
      return;
    }

    const removed = await store.remove(name);
    if (json) {
      emit(success("remove", { name, removed }, start), true);
    } else if (removed) {
      console.log(`Removed ${name}`);
    } else {
      console.error(`Tool not found: ${name}`);
      process.exitCode = 1;
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// run — execute a tool (mutating → supports --dry-run)
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("run <tool> [args...]")
  .description("Run an installed tool")
  .option("--json", "Output as structured JSON envelope")
  .option("--timeout <ms>", "Timeout in milliseconds", "30000")
  .option("--dry-run", "Show what would be executed without running")
  .action(async (tool: string, args: string[], opts: { json?: boolean; timeout: string; dryRun?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try {
      validateToolName(tool);
      validateRunArgs(args);
    } catch (err) {
      const e = err as InputValidationError;
      emit(failure("run", e.code, e.message, start), json);
      return;
    }

    if (opts.dryRun) {
      const store = createStore(DATA_DIR);
      const toolObj = await store.get(tool);
      if (!toolObj) {
        emit(failure("run", "NOT_FOUND", `Tool not found: ${tool}`, start), json);
        return;
      }
      const mainBin = findMainBinary(toolObj.installPath, toolObj.meta.name);
      const data = {
        action: "run",
        tool,
        binary: mainBin,
        args,
        timeout: parseInt(opts.timeout, 10),
        installPath: toolObj.installPath,
      };
      if (json) { emit(success("run", data, start), true); }
      else {
        console.log(`Would run: ${mainBin} ${args.join(" ")}`);
        console.log(`  Timeout: ${opts.timeout}ms`);
      }
      return;
    }

    const result = await runTool(tool, args, {
      timeout: parseInt(opts.timeout, 10),
      dataDir: DATA_DIR,
    });

    if (json) {
      // Wrap in CliOutput envelope — agent always gets structured data
      if (result.success) {
        emit(success("run", { output: result.data, duration: result.duration }, start), true);
      } else {
        emit(failure("run", result.error?.code ?? "UNKNOWN", result.error?.message ?? "Unknown error", start, result.error?.details as Record<string, unknown>), true);
      }
    } else if (result.success) {
      console.log(result.data);
    } else {
      console.error(`Error [${result.error?.code}]: ${result.error?.message}`);
      process.exitCode = 1;
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// skills — manage skill bundles
// ══════════════════════════════════════════════════════════════════════════════
const skills = program
  .command("skills")
  .description("Manage skills (SKILL.md bundles of tools)");

skills
  .command("install <path>")
  .description("Install a skill from a SKILL.md file path")
  .option("--json", "Output as structured JSON")
  .option("--dry-run", "Show what would be installed without installing")
  .action(async (skillPath: string, opts: { json?: boolean; dryRun?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const resolved = resolve(skillPath);

    if (!existsSync(resolved)) {
      const result = failure("skills install", "NOT_FOUND", `SKILL.md not found: ${resolved}`, start);
      emit(result, json);
      if (!json) console.error(result.error!.message);
      return;
    }

    if (opts.dryRun) {
      const content = readFileSync(resolved, "utf-8");
      const frontmatter = parseFrontmatter(content);
      if (!frontmatter) {
        emit(failure("skills install", "PARSE_FAILED", "Failed to parse SKILL.md frontmatter", start), json);
        return;
      }
      const data = { action: "install", path: resolved, ...frontmatter };
      if (json) { emit(success("skills install", data, start), true); }
      else {
        console.log(`Would install skill: ${frontmatter.name}@${frontmatter.version}`);
        console.log(`  Ingredients: ${frontmatter.ingredients.join(", ")}`);
      }
      return;
    }

    try {
      if (!json) console.log(`Installing skill from ${resolved}...`);
      const skill = await installSkill(resolved, DATA_DIR);

      if (json) {
        emit(success("skills install", {
          name: skill.frontmatter.name,
          version: skill.frontmatter.version,
          ingredients: skill.ingredients.map(t => ({ name: t.meta.name, version: t.meta.version })),
          contextPath: skill.contextPath,
        }, start), true);
      } else {
        console.log(`\nSkill "${skill.frontmatter.name}" installed successfully`);
        console.log(`  Version: ${skill.frontmatter.version}`);
        console.log(`  Ingredients: ${skill.ingredients.length}`);
        for (const tool of skill.ingredients) {
          console.log(`    - ${tool.meta.name}@${tool.meta.version}`);
        }
        console.log(`  Context: ${skill.contextPath}`);
      }
    } catch (err) {
      const msg = toErrorMessage(err);
      const result = failure("skills install", "SKILL_INSTALL_FAILED", msg, start);
      emit(result, json);
      if (!json) { console.error(`Skill install failed: ${msg}`); process.exitCode = 1; }
    }
  });

skills
  .command("generate <name>")
  .description("Generate a SKILL.md — from an installed tool (--from-tool) or as scaffold")
  .option("-d, --description <desc>", "Skill description", "A new skill")
  .option("--from-tool <tool>", "Generate rich SKILL.md from an installed tool's capabilities")
  .option("--json", "Output as structured JSON")
  .action(async (name: string, opts: { description: string; fromTool?: string; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    const store = createStore(DATA_DIR);
    const toolKey = opts.fromTool ?? name;
    const tool = await store.get(toolKey);

    if (opts.fromTool) {
      if (!tool) {
        emit(failure("skills generate", "NOT_FOUND", `Tool not found: ${opts.fromTool}`, start), json);
        return;
      }

      const content = generateRichSkillMd(tool);
      const outPath = resolve(`${name}.SKILL.md`);
      writeFileSync(outPath, content, "utf-8");

      if (json) {
        emit(success("skills generate", { path: outPath, fromTool: opts.fromTool, lines: content.split("\n").length }, start), true);
      } else {
        console.log(`Generated rich SKILL.md from ${opts.fromTool}: ${outPath}`);
        console.log(`  ${content.split("\n").length} lines`);
      }
    } else {
      if (tool) {
        const content = generateRichSkillMd(tool);
        const outPath = resolve(`${name}.SKILL.md`);
        writeFileSync(outPath, content, "utf-8");
        if (json) {
          emit(success("skills generate", { path: outPath, fromTool: name, lines: content.split("\n").length }, start), true);
        } else {
          console.log(`Generated rich SKILL.md from installed tool "${name}": ${outPath}`);
          console.log(`  ${content.split("\n").length} lines`);
        }
      } else {
        // Fallback: scaffold a blank SKILL.md (no installed tool to analyze)
        if (!json) console.log(`  ⚠ Tool "${name}" not installed — generating basic scaffold. Use --from-tool or install first for a rich skill.`);
        const content = generateSkillMd(name, opts.description);
        const outPath = resolve("SKILL.md");
        writeFileSync(outPath, content, "utf-8");
        if (json) {
          emit(success("skills generate", { path: outPath, rich: false }, start), true);
        } else {
          console.log(`Generated ${outPath}`);
        }
      }
    }
  });

skills
  .command("context <path>")
  .description("Build and display the assembled context for a skill")
  .option("--json", "Output as structured JSON")
  .action(async (skillPath: string, opts: { json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const resolved = resolve(skillPath);

    if (!existsSync(resolved)) {
      emit(failure("skills context", "NOT_FOUND", `SKILL.md not found: ${resolved}`, start), json);
      return;
    }

    const content = readFileSync(resolved, "utf-8");
    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
      emit(failure("skills context", "PARSE_FAILED", "Failed to parse SKILL.md frontmatter", start), json);
      return;
    }

    const store = createStore(DATA_DIR);
    const tools: Tool[] = [];
    for (const ingredient of frontmatter.ingredients) {
      const toolId = ingredient.replace(/[/@]/g, "-").replace(/^-/, "");
      const tool = await store.get(toolId);
      if (tool) tools.push(tool);
    }

    const bodyMatch = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/.exec(content);
    const body = bodyMatch?.[1]?.trim() ?? "";

    const { discoverResources } = await import("../lib/skills.js");
    const { dirname } = await import("node:path");
    const resources = discoverResources(dirname(resolved));

    const skill = {
      frontmatter,
      body,
      ingredients: tools,
      contextPath: join(DATA_DIR, "skills", frontmatter.name, "CONTEXT.md"),
      resources,
    };

    const contextMd = buildContext(skill);
    if (json) {
      emit(success("skills context", { context: contextMd, frontmatter, toolCount: tools.length }, start), true);
    } else {
      console.log(contextMd);
    }
  });

skills
  .command("list")
  .description("List all installed skills")
  .option("--json", "Output as structured JSON")
  .action((opts: { json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const installed = listSkills(DATA_DIR);

    if (json) {
      emit(success("skills list", { skills: installed, total: installed.length }, start), true);
      return;
    }

    if (installed.length === 0) {
      console.log("No skills installed.");
      return;
    }
    console.log(`\n  Installed skills (${installed.length}):\n`);
    for (const skill of installed) {
      const tags = skill.tags.length > 0 ? ` [${skill.tags.join(", ")}]` : "";
      console.log(`  ${skill.name}@${skill.version}${tags}`);
      if (skill.description) console.log(`    ${skill.description}`);
      console.log(`    Tools: ${skill.toolIds.join(", ") || "none"}`);
      const res = skill.resources;
      if (res.scripts || res.references || res.assets) {
        console.log(`    Resources: ${res.scripts} scripts, ${res.references} references, ${res.assets} assets`);
      }
    }
    console.log();
  });

skills
  .command("remove <name>")
  .description("Remove an installed skill")
  .option("--with-tools", "Also remove the skill's tools")
  .option("--json", "Output as structured JSON")
  .option("--dry-run", "Show what would be removed without removing")
  .action(async (name: string, opts: { withTools?: boolean; json?: boolean; dryRun?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    if (opts.dryRun) {
      const data = { action: "remove", name, withTools: opts.withTools ?? false };
      if (json) { emit(success("skills remove", data, start), true); }
      else { console.log(`Would remove skill: ${name}${opts.withTools ? " and its tools" : ""}`); }
      return;
    }

    const removed = await removeSkill(name, DATA_DIR, { removeTools: opts.withTools });
    if (json) {
      emit(success("skills remove", { name, removed }, start), true);
    } else if (removed) {
      console.log(`Removed skill "${name}"${opts.withTools ? " and its tools" : ""}`);
    } else {
      console.error(`Skill not found: ${name}`);
      process.exitCode = 1;
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// freeze — generate lockfile
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("freeze")
  .description("Generate agentcli.lock from currently installed tools")
  .option("-o, --output <path>", "Output path for lockfile", "agentcli.lock")
  .option("--json", "Output as structured JSON")
  .action(async (opts: { output: string; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const store = createStore(DATA_DIR);
    const result = await store.list();

    if (result.tools.length === 0) {
      if (json) { emit(success("freeze", { entries: 0 }, start), true); }
      else { console.log("No tools installed. Nothing to freeze."); }
      return;
    }

    const lockPath = resolve(opts.output);
    writeLockfile(lockPath, [...result.tools]);

    if (json) {
      emit(success("freeze", { path: lockPath, entries: result.tools.length }, start), true);
    } else {
      console.log(`Wrote ${lockPath} with ${result.tools.length} entries`);
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// install — install from lockfile (mutating → supports --dry-run)
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("install")
  .description("Install all tools from agentcli.lock")
  .option("-l, --lockfile <path>", "Path to lockfile", "agentcli.lock")
  .option("--json", "Output as structured JSON")
  .option("--dry-run", "Show what would be installed without installing")
  .action(async (opts: { lockfile: string; json?: boolean; dryRun?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const lockPath = resolve(opts.lockfile);
    const lockfile = readLockfile(lockPath);

    if (!lockfile) {
      const result = failure("install", "LOCKFILE_NOT_FOUND", `Could not read lockfile: ${lockPath}`, start);
      emit(result, json);
      if (!json) console.error(result.error!.message);
      return;
    }

    if (opts.dryRun) {
      const data = {
        action: "install",
        lockfile: lockPath,
        entries: lockfile.entries.map(e => ({ id: e.id, version: e.version, source: e.source })),
      };
      if (json) { emit(success("install", data, start), true); }
      else {
        console.log(`Would install ${lockfile.entries.length} tools from ${lockPath}:`);
        for (const e of lockfile.entries) console.log(`  ${e.id}@${e.version}`);
      }
      return;
    }

    if (!json) console.log(`Installing ${lockfile.entries.length} tools from ${lockPath}...`);
    const installer = createInstaller();
    const analyzer = createAnalyzer();
    const store = createStore(DATA_DIR);
    const installed: string[] = [];
    const failed: string[] = [];

    for (const entry of lockfile.entries) {
      if (!json) console.log(`  Installing ${entry.id}@${entry.version}...`);
      try {
        const installDir = getToolInstallDir(DATA_DIR, entry.id);
        if (installer.supports(entry.source.format)) {
          await installer.install(entry.source, installDir);
        }

        let capabilities: ToolCapabilities = { commands: [], globalFlags: [], analysisMethod: "help-probe" };
        const mainBin = findMainBinary(installDir, entry.id);
        if (mainBin) {
          try { capabilities = await analyzer.analyze(mainBin); } catch { /* use defaults */ }
        }

        const now = new Date().toISOString();
        const tool: Tool = {
          id: entry.id,
          meta: { name: entry.id, version: entry.version, description: "", tags: [] },
          source: entry.source,
          capabilities,
          installPath: installDir,
          status: "installed",
          installedAt: now,
          updatedAt: now,
        };
        await store.save(tool);
        installed.push(entry.id);
        if (!json) console.log(`    Done`);
      } catch (err) {
        failed.push(entry.id);
        if (!json) console.error(`    Failed: ${toErrorMessage(err)}`);
      }
    }

    if (json) {
      emit(success("install", { installed, failed, total: lockfile.entries.length }, start), true);
    } else {
      console.log("Install complete.");
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// search — search registry
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("search <query>")
  .description("Search the registry cascade for tools")
  .option("-l, --limit <n>", "Max results", "20")
  .option("--json", "Output as structured JSON")
  .action(async (query: string, opts: { limit: string; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const store = createStore(DATA_DIR);
    const registry = createRegistry(store);
    const limit = parseInt(opts.limit, 10) || 20;

    const results = await registry.search({ query, limit });

    if (json) {
      emit(success("search", { query, results, total: results.length }, start), true);
      return;
    }

    if (!json) console.log(`Searching for "${query}"...`);
    if (results.length === 0) {
      console.log("No results found.");
      return;
    }
    console.log(`\n  Found ${results.length} results:\n`);
    for (const entry of results) {
      const badge = entry.layer === "local" ? " (installed)" : ` [${entry.layer}]`;
      console.log(`  ${entry.meta.name}@${entry.meta.version}${badge}`);
      if (entry.meta.description) console.log(`    ${entry.meta.description}`);
    }
    console.log();
  });

// ══════════════════════════════════════════════════════════════════════════════
// scan — scan directory for CLIs
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("scan <directory>")
  .description("Scan a directory for CLI tools and analyze them")
  .option("--json", "Output as structured JSON")
  .option("--deep", "Deep-probe subcommands recursively")
  .action(async (directory: string, opts: { json?: boolean; deep?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const dir = resolve(directory);

    if (!existsSync(dir)) {
      emit(failure("scan", "DIR_NOT_FOUND", `Directory not found: ${dir}`, start), json);
      return;
    }

    const analyzer = createAnalyzer();
    const { readdirSync, statSync } = await import("node:fs");
    const entries = readdirSync(dir);
    const found: { name: string; commands: number; flags: number; path: string }[] = [];

    if (!json) console.log(`Scanning ${dir}...`);
    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        const st = statSync(full);
        if (st.isFile() && (st.mode & 0o111)) {
          const caps = await analyzer.analyze(full, { timeout: 5000, recursive: opts.deep });
          found.push({ name: entry, commands: caps.commands.length, flags: caps.globalFlags.length, path: full });
          if (!json) {
            console.log(`\n  ${entry}`);
            console.log(`    Commands: ${caps.commands.length}, Flags: ${caps.globalFlags.length}`);
            if (caps.commands.length > 0) console.log(`    ${caps.commands.map((c) => c.name).join(", ")}`);
          }
        }
      } catch { /* skip non-analyzable */ }
    }

    if (json) {
      emit(success("scan", { directory: dir, tools: found, total: found.length }, start), true);
    } else {
      console.log(`\nFound ${found.length} tools.`);
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// info — registry info
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("info <name>")
  .description("Show detailed info from registry (local or remote)")
  .option("--json", "Output as structured JSON")
  .action(async (name: string, opts: { json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const store = createStore(DATA_DIR);
    const registry = createRegistry(store);
    const entry = await registry.lookup(name);

    if (!entry) {
      const result = failure("info", "NOT_FOUND", `Not found in registry: ${name}`, start);
      emit(result, json);
      if (!json) console.error(result.error!.message);
      return;
    }

    if (json) {
      emit(success("info", entry, start), true);
    } else {
      console.log(`\n  ${entry.meta.name}@${entry.meta.version} [${entry.layer}]`);
      console.log(`  ${entry.meta.description}`);
      console.log(`  Source: ${entry.source.format}:${entry.source.uri}`);
      if (entry.meta.homepage) console.log(`  Homepage: ${entry.meta.homepage}`);
      if (entry.meta.license) console.log(`  License: ${entry.meta.license}`);
      if (entry.meta.tags.length > 0) console.log(`  Tags: ${entry.meta.tags.join(", ")}`);
      console.log(`  Verified: ${entry.verified}`);
      console.log();
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// update — update tool(s)
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("update [name]")
  .description("Update an installed tool to latest version")
  .option("--json", "Output as structured JSON")
  .action(async (name: string | undefined, opts: { json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const store = createStore(DATA_DIR);

    if (name) {
      const tool = await store.get(name);
      if (!tool) {
        emit(failure("update", "NOT_FOUND", `Tool not found: ${name}`, start), json);
        return;
      }
      if (!json) console.log(`Updating ${name}...`);
      const resolver = createResolver();
      const installer = createInstaller();
      const analyzer = createAnalyzer();
      const resolved = await resolver.resolve(tool.source.uri);
      const installDir = getToolInstallDir(DATA_DIR, name);
      await installer.install(resolved.source, installDir, { force: true });

      let capabilities = tool.capabilities;
      const mainBin = findMainBinary(installDir, name);
      if (mainBin) {
        try { capabilities = await analyzer.analyze(mainBin); } catch { /* keep existing */ }
      }
      const version = readPkgVersion(installDir, resolved.meta.version ?? tool.meta.version);
      const now = new Date().toISOString();
      await store.save({ ...tool, capabilities, meta: { ...tool.meta, version }, updatedAt: now });

      if (json) { emit(success("update", { name, version, updated: true }, start), true); }
      else { console.log(`Updated ${name} → ${version}`); }
    } else {
      const result = await store.list();
      const updated: string[] = [];
      const failed: string[] = [];

      if (!json) console.log(`Updating all ${result.total} tools...`);
      for (const tool of result.tools) {
        try {
          if (!json) console.log(`  Updating ${tool.meta.name}...`);
          const resolver = createResolver();
          const installer = createInstaller();
          const analyzer = createAnalyzer();
          if (installer.supports(tool.source.format)) {
            const resolved = await resolver.resolve(tool.source.uri);
            const installDir = getToolInstallDir(DATA_DIR, tool.id);
            await installer.install(resolved.source, installDir, { force: true });
            let capabilities = tool.capabilities;
            const mainBin = findMainBinary(installDir, tool.meta.name);
            if (mainBin) { try { capabilities = await analyzer.analyze(mainBin); } catch { /* keep existing */ } }
            const version = readPkgVersion(installDir, resolved.meta.version ?? tool.meta.version);
            const now = new Date().toISOString();
            await store.save({ ...tool, capabilities, meta: { ...tool.meta, version }, updatedAt: now });
            updated.push(tool.id);
            if (!json) console.log(`    Done`);
          }
        } catch (err) {
          failed.push(tool.id);
          if (!json) console.error(`    Failed: ${toErrorMessage(err)}`);
        }
      }
      if (json) { emit(success("update", { updated, failed }, start), true); }
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// verify — verify lockfile
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("verify")
  .description("Verify installed tools match the lockfile")
  .option("-l, --lockfile <path>", "Path to lockfile", "agentcli.lock")
  .option("--json", "Output as structured JSON")
  .action(async (opts: { lockfile: string; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const lockPath = resolve(opts.lockfile);
    const lockfile = readLockfile(lockPath);

    if (!lockfile) {
      emit(failure("verify", "LOCKFILE_NOT_FOUND", `Could not read lockfile: ${lockPath}`, start), json);
      return;
    }

    const store = createStore(DATA_DIR);
    const results: { id: string; version: string; status: "ok" | "missing" | "mismatch"; installed?: string }[] = [];

    for (const entry of lockfile.entries) {
      const tool = await store.get(entry.id);
      if (!tool) {
        results.push({ id: entry.id, version: entry.version, status: "missing" });
      } else if (tool.meta.version !== entry.version) {
        results.push({ id: entry.id, version: entry.version, status: "mismatch", installed: tool.meta.version });
      } else {
        results.push({ id: entry.id, version: entry.version, status: "ok" });
      }
    }

    const allOk = results.every(r => r.status === "ok");

    if (json) {
      emit(success("verify", { results, allOk }, start), true);
    } else {
      for (const r of results) {
        if (r.status === "ok") console.log(`  OK       ${r.id}@${r.version}`);
        else if (r.status === "missing") console.log(`  MISSING  ${r.id}@${r.version}`);
        else console.log(`  MISMATCH ${r.id} (installed: ${r.installed}, locked: ${r.version})`);
      }
      console.log(allOk ? "\nAll tools verified." : "\nSome tools are missing or mismatched. Run: agents-cli install");
      if (!allOk) process.exitCode = 1;
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// mcp — MCP server management
// ══════════════════════════════════════════════════════════════════════════════
const mcp = program.command("mcp").description("MCP server management");

mcp
  .command("start")
  .description("Start the MCP server with all installed tool directories")
  .option("--json", "Output as structured JSON")
  .action(async (opts: { json?: boolean }) => {
    const json = isJsonMode(opts);
    const store = createStore(DATA_DIR);
    const result = await store.list();
    const toolDirs = result.tools.map((t) => join(DATA_DIR, "tools", t.id));

    const config = createMcpConfig(toolDirs);
    const bridge = new McpBridge();
    bridge.startServer(config);

    if (json) {
      console.log(JSON.stringify({ ok: true, command: "mcp start", tools: toolDirs.length }));
    } else {
      console.log(`MCP server started with ${toolDirs.length} tool directories`);
      console.log("Press Ctrl+C to stop.");
    }

    await new Promise<void>((res) => {
      process.on("SIGINT", () => { bridge.stopServer(); res(); });
      process.on("SIGTERM", () => { bridge.stopServer(); res(); });
    });
  });

mcp
  .command("list")
  .description("List tools available through MCP")
  .option("--json", "Output as structured JSON")
  .action(async (opts: { json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const store = createStore(DATA_DIR);
    const result = await store.list();
    const toolDirs = result.tools.map((t) => join(DATA_DIR, "tools", t.id));

    const config = createMcpConfig(toolDirs);
    const bridge = new McpBridge();
    bridge.startServer(config);

    try {
      const tools = await bridge.listTools();
      if (json) {
        emit(success("mcp list", { tools }, start), true);
      } else {
        console.log(`\n  MCP tools (${tools.length}):\n`);
        for (const tool of tools) {
          console.log(`  ${tool.name}`);
          if (tool.description) console.log(`    ${tool.description}`);
        }
      }
    } finally {
      bridge.stopServer();
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// init — scaffold project
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("init")
  .description("Initialize a new agents-cli project with SKILL.md")
  .option("-n, --name <name>", "Project name", "my-agent")
  .option("-d, --description <desc>", "Project description", "A new agent skill")
  .option("--json", "Output as structured JSON")
  .action((opts: { name: string; description: string; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const skillPath = resolve("SKILL.md");

    if (existsSync(skillPath)) {
      emit(failure("init", "ALREADY_EXISTS", "SKILL.md already exists in this directory.", start), json);
      if (!json) console.error("SKILL.md already exists in this directory.");
      return;
    }

    const content = generateSkillMd(opts.name, opts.description);
    writeFileSync(skillPath, content, "utf-8");

    if (json) {
      emit(success("init", { path: skillPath, name: opts.name }, start), true);
    } else {
      console.log(`Initialized ${skillPath}`);
      console.log(`\nNext steps:`);
      console.log(`  1. Edit SKILL.md to add your tool ingredients`);
      console.log(`  2. Run: agents-cli skills install SKILL.md`);
      console.log(`  3. Run: agents-cli freeze`);
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// publish — placeholder
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("publish <name>")
  .description("Publish a tool to the community registry (placeholder)")
  .option("--json", "Output as structured JSON")
  .action(async (name: string, opts: { json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const store = createStore(DATA_DIR);
    const tool = await store.get(name);

    if (!tool) {
      emit(failure("publish", "NOT_FOUND", `Tool not found: ${name}`, start), json);
      return;
    }

    if (json) {
      emit(success("publish", { name, status: "not_available", hint: "Add topic 'agents-cli' to your GitHub repo" }, start), true);
    } else {
      console.log(`Publishing ${name} to community registry...`);
      console.log("Community registry publishing is not yet available.");
      console.log("Contribution: add topic 'agents-cli' to your GitHub repo to be indexed.");
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// skills test — test skill quality
// ══════════════════════════════════════════════════════════════════════════════
skills
  .command("test [dir]")
  .description("Test skill quality (trigger scoring + structural quality)")
  .option("--strict", "Fail if any skill doesn't pass quality gate")
  .option("--domain <domain>", "Filter by domain")
  .option("--json", "Output as structured JSON")
  .action(async (dir: string | undefined, opts: { strict?: boolean; domain?: string; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try {
      const { testAllSkillsSync } = await import("../lib/skill-tester.js");
      const skillsDir = dir ? resolve(dir) : join(DATA_DIR, "skills");

      if (!existsSync(skillsDir)) {
        const result = failure("skills test", "DIR_NOT_FOUND", `Skills directory not found: ${skillsDir}`, start);
        emit(result, json);
        if (!json) console.error(result.error!.message);
        return;
      }

      const results = testAllSkillsSync(skillsDir, opts.domain);

      if (json) {
        emit(success("skills test", { results, total: results.length }, start), true);
      } else {
        const { printQualityReport } = await import("../lib/skill-tester.js");
        printQualityReport(results);
      }

      if (opts.strict) {
        const failing = results.filter(r => !r.passed);
        if (failing.length > 0) {
          if (!json) console.error(`\n${failing.length} skill(s) below quality gate (0.5)`);
          process.exitCode = 1;
        }
      }
    } catch (err) {
      const msg = toErrorMessage(err);
      if (json) { emit(failure("skills test", "TEST_FAILED", msg, start), true); }
      else { console.error(`Skill test failed: ${msg}`); process.exitCode = 1; }
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// skills group — group skills by domain and generate indexes
// ══════════════════════════════════════════════════════════════════════════════
skills
  .command("group")
  .description("Group skills by domain and generate hierarchical indexes")
  .option("--dir <path>", "Skills directory")
  .option("--json", "Output as structured JSON")
  .action(async (opts: { dir?: string; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try {
      const { groupByDomain } = await import("../lib/indexes.js");
      const { readdirSync } = await import("node:fs");

      const dir = opts.dir ? resolve(opts.dir) : join(DATA_DIR, "skills");

      if (!existsSync(dir)) {
        const result = failure("skills group", "DIR_NOT_FOUND", `Skills directory not found: ${dir}`, start);
        emit(result, json);
        if (!json) console.error(result.error!.message);
        return;
      }

      // Scan for SKILL.md files and extract manifest entries
      const { parseFrontmatter: parseFm } = await import("../lib/skills.js");
      const entries: ManifestEntry[] = [];
      const items = readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        if (!item.isDirectory()) continue;
        if (item.name.startsWith("_") || item.name.startsWith(".")) continue;
        const skillPath = join(dir, item.name, "SKILL.md");
        if (!existsSync(skillPath)) continue;
        const content = readFileSync(skillPath, "utf-8");
        const fm = parseFm(content);
        if (fm) {
          entries.push({
            name: fm.name,
            repo: "",
            domain: fm.domain ?? "uncategorized",
            description: fm.description ?? "",
          });
        }
      }

      const grouped = groupByDomain(entries);
      const domainCount = grouped.size;

      if (json) {
        const domains: Record<string, number> = {};
        for (const [domain, items] of grouped) {
          domains[domain] = items.length;
        }
        emit(success("skills group", { domains, totalSkills: entries.length, domainCount }, start), true);
      } else {
        console.log(`\nGrouped ${entries.length} skills into ${domainCount} domains:\n`);
        for (const [domain, items] of grouped) {
          console.log(`  ${domain} (${items.length})`);
        }
        console.log();
      }
    } catch (err) {
      const msg = toErrorMessage(err);
      if (json) { emit(failure("skills group", "GROUP_FAILED", msg, start), true); }
      else { console.error(`Skills grouping failed: ${msg}`); process.exitCode = 1; }
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// skills factory — run 3-layer skill factory
// ══════════════════════════════════════════════════════════════════════════════
skills
  .command("factory")
  .description("Run 3-layer skill factory (structural + optional AI)")
  .option("--manifest <path>", "Path to skills-manifest.json")
  .option("--domain <name>", "Filter by domain")
  .option("--repo <name>", "Filter by repo")
  .option("--ai", "Enable Layer 3 (Claude Batch API)")
  .option("--force", "Force regeneration")
  .option("--dry-run", "Preview without writing")
  .option("--json", "Output as structured JSON")
  .action(async (opts: { manifest?: string; domain?: string; repo?: string; ai?: boolean; force?: boolean; dryRun?: boolean; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try {
      const { runSkillFactory } = await import("../lib/skill-factory.js");

      const factoryOpts = {
        manifestPath: opts.manifest ?? join(DATA_DIR, "skills-manifest.json"),
        skillsDir: join(DATA_DIR, "skills"),
        opensrcDir: join(DATA_DIR, "opensrc"),
        domain: opts.domain,
        repo: opts.repo,
        ai: opts.ai,
        force: opts.force,
        dryRun: opts.dryRun,
      };

      const result = await runSkillFactory(factoryOpts);

      if (json) {
        emit(success("skills factory", result, start), true);
      } else {
        console.log(opts.dryRun ? `Skill factory (dry-run):` : `Skill factory complete.`);
        console.log(`  Generated: ${result.generated}`);
        console.log(`  Skipped: ${result.skipped}`);
        console.log(`  Total: ${result.total}`);
        console.log(`  Domains: ${result.domains.join(", ") || "none"}`);
        if (result.errors.length > 0) {
          console.log(`  Errors: ${result.errors.length}`);
          for (const e of result.errors) console.log(`    - ${e}`);
        }
      }
    } catch (err) {
      const msg = toErrorMessage(err);
      if (json) { emit(failure("skills factory", "FACTORY_FAILED", msg, start), true); }
      else { console.error(`Skill factory failed: ${msg}`); process.exitCode = 1; }
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// pipeline — discover packages from natural language prompt
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("pipeline <prompt>")
  .description("Analyze prompt and discover packages from npm/GitHub/crates")
  .option("--dry-run", "Analyze prompt without searching registries")
  .option("--json", "Output as structured JSON")
  .action(async (prompt: string, opts: { dryRun?: boolean; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try {
      const { classifyIntent } = await import("../lib/pipeline/intent.js");
      const { parsePrompt } = await import("../lib/pipeline/prompt-parser.js");
      const { extractEntities } = await import("../lib/pipeline/entity-extractor.js");

      const intent = classifyIntent(prompt);
      const parsed = parsePrompt(prompt);
      const entities = extractEntities(prompt);

      if (opts.dryRun) {
        const data = { prompt, intent, parsed, entities };
        if (json) { emit(success("pipeline", data, start), true); }
        else {
          console.log("Pipeline analysis (dry-run):");
          console.log(`  Prompt: ${prompt}`);
          console.log(`  Intent: ${intent.intent} (confidence: ${intent.confidence})`);
          if (parsed.capabilities.length > 0) console.log(`  Capabilities: ${parsed.capabilities.join(", ")}`);
          console.log(`  Entities: ${entities.map(e => e.name).join(", ") || "none"}`);
        }
        return;
      }

      // Non-dry-run: actually discover packages from registries
      const { discoverNpmPackages } = await import("../lib/classifier/npm.js");
      const { discoverGitHubRepos } = await import("../lib/classifier/github.js");
      const { CAPABILITY_SEARCH_MAP } = await import("../lib/pipeline/capability-map.js");

      // Collect search terms from parsed capabilities
      const searchTerms = new Set<string>();
      for (const cap of parsed.capabilities) {
        const mapping = CAPABILITY_SEARCH_MAP[cap];
        if (mapping) {
          for (const term of mapping.npm) searchTerms.add(term);
        }
      }
      // Also use entity names as search terms
      for (const e of entities) {
        searchTerms.add(e.name.toLowerCase());
      }

      // Discover from npm and GitHub in parallel
      const [npmResults, githubResults] = await Promise.allSettled([
        discoverNpmPackages(),
        discoverGitHubRepos(),
      ]);

      const npmPkgs = npmResults.status === "fulfilled" ? npmResults.value : [];
      const githubPkgs = githubResults.status === "fulfilled" ? githubResults.value : [];

      // Filter to relevant packages using search terms
      const allPkgs = [...npmPkgs, ...githubPkgs];
      const relevant = searchTerms.size > 0
        ? allPkgs.filter(p =>
            [...searchTerms].some(t =>
              p.name.includes(t) || p.description.toLowerCase().includes(t)
            )
          )
        : allPkgs;

      // Deduplicate by repo
      const seen = new Set<string>();
      const packages = relevant.filter(p => {
        if (seen.has(p.repo)) return false;
        seen.add(p.repo);
        return true;
      }).slice(0, 25);

      const data = { prompt, intent, parsed, entities, packages };

      if (json) {
        emit(success("pipeline", data, start), true);
      } else {
        console.log(`\nPipeline analysis:`);
        console.log(`  Intent: ${intent.intent} (confidence: ${intent.confidence})`);
        if (parsed.capabilities.length > 0) console.log(`  Capabilities: ${parsed.capabilities.join(", ")}`);
        if (entities.length > 0) {
          console.log(`  Entities:`);
          for (const e of entities) {
            console.log(`    - ${e.name} (${e.type})`);
          }
        }
        if (packages.length > 0) {
          console.log(`\n  Discovered packages (${packages.length}):`);
          for (const p of packages) {
            console.log(`    ${p.name} — ${p.description.slice(0, 80)}`);
          }
        } else {
          console.log(`\n  No packages discovered.`);
        }
        console.log();
      }
    } catch (err) {
      const msg = toErrorMessage(err);
      if (json) { emit(failure("pipeline", "PIPELINE_FAILED", msg, start), true); }
      else { console.error(`Pipeline failed: ${msg}`); process.exitCode = 1; }
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// index — index source directory for FTS search
// ══════════════════════════════════════════════════════════════════════════════
program
  .command("index <source>")
  .description("Index source directory for FTS search")
  .option("--domain <name>", "Domain for indexing")
  .option("--dry-run", "Preview without indexing")
  .option("--json", "Output as structured JSON")
  .action(async (source: string, opts: { domain?: string; dryRun?: boolean; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);
    const sourcePath = resolve(source);

    if (!existsSync(sourcePath)) {
      const result = failure("index", "DIR_NOT_FOUND", `Source directory not found: ${sourcePath}`, start);
      emit(result, json);
      if (!json) console.error(result.error!.message);
      return;
    }

    try {
      const { indexSources } = await import("../lib/indexer.js");

      if (opts.dryRun) {
        const data = { action: "index", source: sourcePath, domain: opts.domain ?? "default" };
        if (json) { emit(success("index", data, start), true); }
        else {
          console.log(`Would index: ${sourcePath}`);
          console.log(`  Domain: ${opts.domain ?? "default"}`);
        }
        return;
      }

      const result = await indexSources({ sourceDirs: [sourcePath], domain: opts.domain });

      if (json) {
        emit(success("index", result, start), true);
      } else {
        console.log(`Indexed ${sourcePath}`);
        console.log(`  Packages: ${result.packages}`);
        console.log(`  Chunks: ${result.totalChunks}`);
      }
    } catch (err) {
      const msg = toErrorMessage(err);
      if (json) { emit(failure("index", "INDEX_FAILED", msg, start), true); }
      else { console.error(`Indexing failed: ${msg}`); process.exitCode = 1; }
    }
  });

// ══════════════════════════════════════════════════════════════════════════════
// plugin — plugin management
// ══════════════════════════════════════════════════════════════════════════════
const plugin = program.command("plugin").description("Plugin management");

plugin
  .command("build")
  .description("Build domain plugins from skills")
  .option("--domain <name>", "Build only this domain")
  .option("--ai", "Generate AI-enhanced agent definitions")
  .option("--dry-run", "Preview without building")
  .option("--json", "Output as structured JSON")
  .action(async (opts: { domain?: string; ai?: boolean; dryRun?: boolean; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try {
      const { buildPlugins } = await import("../lib/plugin/builder.js");

      if (opts.dryRun) {
        const data = { action: "build", domain: opts.domain ?? "all", ai: opts.ai ?? false };
        if (json) { emit(success("plugin build", data, start), true); }
        else {
          console.log("Would build plugins:");
          console.log(`  Domain: ${opts.domain ?? "all"}`);
          console.log(`  AI: ${opts.ai ?? false}`);
        }
        return;
      }

      await buildPlugins({
        domain: opts.domain,
        aiGenerate: opts.ai,
        rootDir: DATA_DIR,
      });

      const data = { domain: opts.domain ?? "all", ai: opts.ai ?? false };
      if (json) {
        emit(success("plugin build", data, start), true);
      } else {
        console.log(`Plugin build complete.`);
        console.log(`  Domain: ${opts.domain ?? "all"}`);
      }
    } catch (err) {
      const msg = toErrorMessage(err);
      if (json) { emit(failure("plugin build", "BUILD_FAILED", msg, start), true); }
      else { console.error(`Plugin build failed: ${msg}`); process.exitCode = 1; }
    }
  });

plugin
  .command("publish")
  .description("Publish domain plugins to npm")
  .option("--domain <name>", "Publish only this domain")
  .option("--dry-run", "Preview without publishing")
  .option("--json", "Output as structured JSON")
  .action(async (opts: { domain?: string; dryRun?: boolean; json?: boolean }) => {
    const start = Date.now();
    const json = isJsonMode(opts);

    try {
      const { publishAllPlugins } = await import("../lib/plugin/publisher.js");

      if (opts.dryRun) {
        const data = { action: "publish", domain: opts.domain ?? "all" };
        if (json) { emit(success("plugin publish", data, start), true); }
        else {
          console.log("Would publish plugins:");
          console.log(`  Domain: ${opts.domain ?? "all"}`);
        }
        return;
      }

      await publishAllPlugins(false, opts.domain);

      const data = { domain: opts.domain ?? "all" };
      if (json) {
        emit(success("plugin publish", data, start), true);
      } else {
        console.log(`Plugin publish complete.`);
        console.log(`  Domain: ${opts.domain ?? "all"}`);
      }
    } catch (err) {
      const msg = toErrorMessage(err);
      if (json) { emit(failure("plugin publish", "PUBLISH_FAILED", msg, start), true); }
      else { console.error(`Plugin publish failed: ${msg}`); process.exitCode = 1; }
    }
  });

program.parse();

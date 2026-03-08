import { Command } from "commander";
import { createResolver } from "../lib/resolver.js";
import { createStore } from "../lib/store.js";

const VERSION = "0.1.0";

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
    if (!resolver.supports(source)) {
      console.error(`Unknown source format: ${source}`);
      process.exitCode = 1;
      return;
    }
    const result = await resolver.resolve(source);
    console.log(
      `Resolved ${source} → ${result.source.format}:${result.source.uri}`,
    );
    if (opts.force) {
      console.log("(force mode)");
    }
    // Phase 2: install + analyze + store
  });

// ── list ─────────────────────────────────────────────────────────────────────
program
  .command("list")
  .description("List installed tools")
  .option("-s, --status <status>", "Filter by status")
  .action(async (opts: { status?: string }) => {
    const store = createStore(".");
    const result = await store.list(
      opts.status ? { status: opts.status as "installed" } : undefined,
    );
    if (result.tools.length === 0) {
      console.log("No tools installed.");
      return;
    }
    for (const tool of result.tools) {
      console.log(`  ${tool.meta.name}@${tool.meta.version} [${tool.status}]`);
    }
  });

// ── describe ─────────────────────────────────────────────────────────────────
program
  .command("describe <name>")
  .description("Show detailed info about an installed tool")
  .action(async (name: string) => {
    const store = createStore(".");
    const tool = await store.get(name);
    if (!tool) {
      console.error(`Tool not found: ${name}`);
      process.exitCode = 1;
      return;
    }
    console.log(`${tool.meta.name}@${tool.meta.version}`);
    console.log(`  ${tool.meta.description}`);
    console.log(`  Source: ${tool.source.format}:${tool.source.uri}`);
    console.log(`  Status: ${tool.status}`);
    console.log(`  Commands: ${tool.capabilities.commands.length}`);
  });

// ── remove ───────────────────────────────────────────────────────────────────
program
  .command("remove <name>")
  .description("Remove an installed tool")
  .action(async (name: string) => {
    const store = createStore(".");
    const removed = await store.remove(name);
    if (removed) {
      console.log(`Removed ${name}`);
    } else {
      console.error(`Tool not found: ${name}`);
      process.exitCode = 1;
    }
  });

program.parse();

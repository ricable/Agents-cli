import { Command } from "commander";
import { createStore } from "../../lib/store.js";
import { createAnalyzer, findMainBinary, deepProbe } from "../../lib/analyzer.js";
import { success, failure, emit } from "../../lib/output.js";
import { validateToolName, InputValidationError } from "../../lib/guards.js";
import type { ToolSchema, ToolSubcommand } from "../../lib/types.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerSchemaCommand(program: Command): void {
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
}

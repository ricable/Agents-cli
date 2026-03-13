import { Command } from "commander";
import { createStore } from "../../lib/store.js";
import { findMainBinary } from "../../lib/analyzer.js";
import { success, failure, emit } from "../../lib/output.js";
import { validateToolName, validateRunArgs, InputValidationError } from "../../lib/guards.js";
import { runTool } from "../agent-run.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerRunCommand(program: Command): void {
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
}

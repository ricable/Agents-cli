import { Command } from "commander";
import { createStore, generateContextMd } from "../../lib/store.js";
import { success, failure, emit } from "../../lib/output.js";
import { validateToolName, InputValidationError } from "../../lib/guards.js";
import { DATA_DIR, isJsonMode, pickFields } from "./shared.js";

export function registerDescribeCommand(program: Command): void {
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
}

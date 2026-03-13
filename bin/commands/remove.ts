import { Command } from "commander";
import { createStore } from "../../lib/store.js";
import { success, failure, emit } from "../../lib/output.js";
import { validateToolName, InputValidationError } from "../../lib/guards.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerRemoveCommand(program: Command): void {
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
}

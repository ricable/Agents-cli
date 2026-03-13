import { Command } from "commander";
import { resolve } from "node:path";
import { createStore } from "../../lib/store.js";
import { success, emit } from "../../lib/output.js";
import { writeLockfile } from "../../lib/skills.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerFreezeCommand(program: Command): void {
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
}

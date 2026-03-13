import { Command } from "commander";
import { createStore } from "../../lib/store.js";
import { createRegistry } from "../../lib/registry.js";
import { success, failure, emit } from "../../lib/output.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerInfoCommand(program: Command): void {
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
}

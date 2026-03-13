import { Command } from "commander";
import { createStore } from "../../lib/store.js";
import { createRegistry } from "../../lib/registry.js";
import { success, emit } from "../../lib/output.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerSearchCommand(program: Command): void {
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
}

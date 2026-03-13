import { Command } from "commander";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { isJsonMode } from "./shared.js";

export function registerIndexCommand(program: Command): void {
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
        const { indexSources } = await import("../../lib/indexer.js");

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
}

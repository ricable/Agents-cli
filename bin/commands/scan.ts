import { Command } from "commander";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createAnalyzer } from "../../lib/analyzer.js";
import { success, failure, emit } from "../../lib/output.js";
import { isJsonMode } from "./shared.js";

export function registerScanCommand(program: Command): void {
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
}

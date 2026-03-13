import { Command } from "commander";
import { createStore } from "../../lib/store.js";
import { success, emit } from "../../lib/output.js";
import { DATA_DIR, isJsonMode, pickFields } from "./shared.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List installed tools")
    .option("-s, --status <status>", "Filter by status")
    .option("--json", "Output as structured JSON")
    .option("--fields <fields>", "Comma-separated fields to include (context window discipline)")
    .action(async (opts: { status?: string; json?: boolean; fields?: string }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const store = createStore(DATA_DIR);

      const result = await store.list(
        opts.status ? { status: opts.status as "installed" } : undefined,
      );

      if (json) {
        const tools = result.tools.map(t => pickFields(t as unknown as Record<string, unknown>, opts.fields));
        emit(success("list", { tools, total: result.total }, start), true);
        return;
      }

      if (result.tools.length === 0) {
        console.log("No tools installed.");
        return;
      }
      console.log(`\n  Installed tools (${result.total}):\n`);
      for (const tool of result.tools) {
        const tags = tool.meta.tags.length > 0 ? ` [${tool.meta.tags.join(", ")}]` : "";
        console.log(`  ${tool.meta.name}@${tool.meta.version}  (${tool.source.format})${tags}`);
        if (tool.meta.description) {
          console.log(`    ${tool.meta.description}`);
        }
      }
      console.log();
    });
}

import { Command } from "commander";
import { createStore } from "../../lib/store.js";
import { success, failure, emit } from "../../lib/output.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerPublishCommand(program: Command): void {
  program
    .command("publish <name>")
    .description("Publish a tool to the community registry (placeholder)")
    .option("--json", "Output as structured JSON")
    .action(async (name: string, opts: { json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const store = createStore(DATA_DIR);
      const tool = await store.get(name);

      if (!tool) {
        emit(failure("publish", "NOT_FOUND", `Tool not found: ${name}`, start), json);
        return;
      }

      if (json) {
        emit(success("publish", { name, status: "not_available", hint: "Add topic 'agents-cli' to your GitHub repo" }, start), true);
      } else {
        console.log(`Publishing ${name} to community registry...`);
        console.log("Community registry publishing is not yet available.");
        console.log("Contribution: add topic 'agents-cli' to your GitHub repo to be indexed.");
      }
    });
}

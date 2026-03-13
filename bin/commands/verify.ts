import { Command } from "commander";
import { resolve } from "node:path";
import { createStore } from "../../lib/store.js";
import { success, failure, emit } from "../../lib/output.js";
import { readLockfile } from "../../lib/skills.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerVerifyCommand(program: Command): void {
  program
    .command("verify")
    .description("Verify installed tools match the lockfile")
    .option("-l, --lockfile <path>", "Path to lockfile", "agentcli.lock")
    .option("--json", "Output as structured JSON")
    .action(async (opts: { lockfile: string; json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const lockPath = resolve(opts.lockfile);
      const lockfile = readLockfile(lockPath);

      if (!lockfile) {
        emit(failure("verify", "LOCKFILE_NOT_FOUND", `Could not read lockfile: ${lockPath}`, start), json);
        return;
      }

      const store = createStore(DATA_DIR);
      const results: { id: string; version: string; status: "ok" | "missing" | "mismatch"; installed?: string }[] = [];

      for (const entry of lockfile.entries) {
        const tool = await store.get(entry.id);
        if (!tool) {
          results.push({ id: entry.id, version: entry.version, status: "missing" });
        } else if (tool.meta.version !== entry.version) {
          results.push({ id: entry.id, version: entry.version, status: "mismatch", installed: tool.meta.version });
        } else {
          results.push({ id: entry.id, version: entry.version, status: "ok" });
        }
      }

      const allOk = results.every(r => r.status === "ok");

      if (json) {
        emit(success("verify", { results, allOk }, start), true);
      } else {
        for (const r of results) {
          if (r.status === "ok") console.log(`  OK       ${r.id}@${r.version}`);
          else if (r.status === "missing") console.log(`  MISSING  ${r.id}@${r.version}`);
          else console.log(`  MISMATCH ${r.id} (installed: ${r.installed}, locked: ${r.version})`);
        }
        console.log(allOk ? "\nAll tools verified." : "\nSome tools are missing or mismatched. Run: agents-cli install");
        if (!allOk) process.exitCode = 1;
      }
    });
}

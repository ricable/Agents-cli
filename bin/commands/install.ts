import { Command } from "commander";
import { resolve } from "node:path";
import { createStore, getToolInstallDir } from "../../lib/store.js";
import { createInstaller } from "../../lib/installer.js";
import { createAnalyzer, findMainBinary } from "../../lib/analyzer.js";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { readLockfile } from "../../lib/skills.js";
import type { Tool, ToolCapabilities } from "../../lib/types.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerInstallCommand(program: Command): void {
  program
    .command("install")
    .description("Install all tools from agentcli.lock")
    .option("-l, --lockfile <path>", "Path to lockfile", "agentcli.lock")
    .option("--json", "Output as structured JSON")
    .option("--dry-run", "Show what would be installed without installing")
    .action(async (opts: { lockfile: string; json?: boolean; dryRun?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const lockPath = resolve(opts.lockfile);
      const lockfile = readLockfile(lockPath);

      if (!lockfile) {
        const result = failure("install", "LOCKFILE_NOT_FOUND", `Could not read lockfile: ${lockPath}`, start);
        emit(result, json);
        if (!json) console.error(result.error!.message);
        return;
      }

      if (opts.dryRun) {
        const data = {
          action: "install",
          lockfile: lockPath,
          entries: lockfile.entries.map(e => ({ id: e.id, version: e.version, source: e.source })),
        };
        if (json) { emit(success("install", data, start), true); }
        else {
          console.log(`Would install ${lockfile.entries.length} tools from ${lockPath}:`);
          for (const e of lockfile.entries) console.log(`  ${e.id}@${e.version}`);
        }
        return;
      }

      if (!json) console.log(`Installing ${lockfile.entries.length} tools from ${lockPath}...`);
      const installer = createInstaller();
      const analyzer = createAnalyzer();
      const store = createStore(DATA_DIR);
      const installed: string[] = [];
      const failed: string[] = [];

      for (const entry of lockfile.entries) {
        if (!json) console.log(`  Installing ${entry.id}@${entry.version}...`);
        try {
          const installDir = getToolInstallDir(DATA_DIR, entry.id);
          if (installer.supports(entry.source.format)) {
            await installer.install(entry.source, installDir);
          }

          let capabilities: ToolCapabilities = { commands: [], globalFlags: [], analysisMethod: "help-probe" };
          const mainBin = findMainBinary(installDir, entry.id);
          if (mainBin) {
            try { capabilities = await analyzer.analyze(mainBin); } catch { /* use defaults */ }
          }

          const now = new Date().toISOString();
          const tool: Tool = {
            id: entry.id,
            meta: { name: entry.id, version: entry.version, description: "", tags: [] },
            source: entry.source,
            capabilities,
            installPath: installDir,
            status: "installed",
            installedAt: now,
            updatedAt: now,
          };
          await store.save(tool);
          installed.push(entry.id);
          if (!json) console.log(`    Done`);
        } catch (err) {
          failed.push(entry.id);
          if (!json) console.error(`    Failed: ${toErrorMessage(err)}`);
        }
      }

      if (json) {
        emit(success("install", { installed, failed, total: lockfile.entries.length }, start), true);
      } else {
        console.log("Install complete.");
      }
    });
}

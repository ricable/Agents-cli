import { Command } from "commander";
import { createStore, getToolInstallDir } from "../../lib/store.js";
import { createResolver } from "../../lib/resolver.js";
import { createInstaller } from "../../lib/installer.js";
import { createAnalyzer, findMainBinary } from "../../lib/analyzer.js";
import { readPkgVersion } from "../../lib/pkg-utils.js";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update [name]")
    .description("Update an installed tool to latest version")
    .option("--json", "Output as structured JSON")
    .action(async (name: string | undefined, opts: { json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const store = createStore(DATA_DIR);

      if (name) {
        const tool = await store.get(name);
        if (!tool) {
          emit(failure("update", "NOT_FOUND", `Tool not found: ${name}`, start), json);
          return;
        }
        if (!json) console.log(`Updating ${name}...`);
        const resolver = createResolver();
        const installer = createInstaller();
        const analyzer = createAnalyzer();
        const resolved = await resolver.resolve(tool.source.uri);
        const installDir = getToolInstallDir(DATA_DIR, name);
        await installer.install(resolved.source, installDir, { force: true });

        let capabilities = tool.capabilities;
        const mainBin = findMainBinary(installDir, name);
        if (mainBin) {
          try { capabilities = await analyzer.analyze(mainBin); } catch { /* keep existing */ }
        }
        const version = readPkgVersion(installDir, resolved.meta.version ?? tool.meta.version);
        const now = new Date().toISOString();
        await store.save({ ...tool, capabilities, meta: { ...tool.meta, version }, updatedAt: now });

        if (json) { emit(success("update", { name, version, updated: true }, start), true); }
        else { console.log(`Updated ${name} → ${version}`); }
      } else {
        const result = await store.list();
        const updated: string[] = [];
        const failed: string[] = [];

        if (!json) console.log(`Updating all ${result.total} tools...`);
        for (const tool of result.tools) {
          try {
            if (!json) console.log(`  Updating ${tool.meta.name}...`);
            const resolver = createResolver();
            const installer = createInstaller();
            const analyzer = createAnalyzer();
            if (installer.supports(tool.source.format)) {
              const resolved = await resolver.resolve(tool.source.uri);
              const installDir = getToolInstallDir(DATA_DIR, tool.id);
              await installer.install(resolved.source, installDir, { force: true });
              let capabilities = tool.capabilities;
              const mainBin = findMainBinary(installDir, tool.meta.name);
              if (mainBin) { try { capabilities = await analyzer.analyze(mainBin); } catch { /* keep existing */ } }
              const version = readPkgVersion(installDir, resolved.meta.version ?? tool.meta.version);
              const now = new Date().toISOString();
              await store.save({ ...tool, capabilities, meta: { ...tool.meta, version }, updatedAt: now });
              updated.push(tool.id);
              if (!json) console.log(`    Done`);
            }
          } catch (err) {
            failed.push(tool.id);
            if (!json) console.error(`    Failed: ${toErrorMessage(err)}`);
          }
        }
        if (json) { emit(success("update", { updated, failed }, start), true); }
      }
    });
}

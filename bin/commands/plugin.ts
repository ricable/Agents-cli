import { Command } from "commander";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerPluginCommand(program: Command): void {
  const plugin = program.command("plugin").description("Plugin management");

  plugin
    .command("build")
    .description("Build domain plugins from skills")
    .option("--domain <name>", "Build only this domain")
    .option("--ai", "Generate AI-enhanced agent definitions")
    .option("--dry-run", "Preview without building")
    .option("--json", "Output as structured JSON")
    .action(async (opts: { domain?: string; ai?: boolean; dryRun?: boolean; json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const { buildPlugins } = await import("../../lib/plugin/builder.js");

        if (opts.dryRun) {
          const data = { action: "build", domain: opts.domain ?? "all", ai: opts.ai ?? false };
          if (json) { emit(success("plugin build", data, start), true); }
          else {
            console.log("Would build plugins:");
            console.log(`  Domain: ${opts.domain ?? "all"}`);
            console.log(`  AI: ${opts.ai ?? false}`);
          }
          return;
        }

        await buildPlugins({
          domain: opts.domain,
          aiGenerate: opts.ai,
          rootDir: DATA_DIR,
        });

        const data = { domain: opts.domain ?? "all", ai: opts.ai ?? false };
        if (json) {
          emit(success("plugin build", data, start), true);
        } else {
          console.log(`Plugin build complete.`);
          console.log(`  Domain: ${opts.domain ?? "all"}`);
        }
      } catch (err) {
        const msg = toErrorMessage(err);
        if (json) { emit(failure("plugin build", "BUILD_FAILED", msg, start), true); }
        else { console.error(`Plugin build failed: ${msg}`); process.exitCode = 1; }
      }
    });

  plugin
    .command("publish")
    .description("Publish domain plugins to npm")
    .option("--domain <name>", "Publish only this domain")
    .option("--dry-run", "Preview without publishing")
    .option("--json", "Output as structured JSON")
    .action(async (opts: { domain?: string; dryRun?: boolean; json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const { publishAllPlugins } = await import("../../lib/plugin/publisher.js");

        if (opts.dryRun) {
          const data = { action: "publish", domain: opts.domain ?? "all" };
          if (json) { emit(success("plugin publish", data, start), true); }
          else {
            console.log("Would publish plugins:");
            console.log(`  Domain: ${opts.domain ?? "all"}`);
          }
          return;
        }

        await publishAllPlugins(false, opts.domain);

        const data = { domain: opts.domain ?? "all" };
        if (json) {
          emit(success("plugin publish", data, start), true);
        } else {
          console.log(`Plugin publish complete.`);
          console.log(`  Domain: ${opts.domain ?? "all"}`);
        }
      } catch (err) {
        const msg = toErrorMessage(err);
        if (json) { emit(failure("plugin publish", "PUBLISH_FAILED", msg, start), true); }
        else { console.error(`Plugin publish failed: ${msg}`); process.exitCode = 1; }
      }
    });
}

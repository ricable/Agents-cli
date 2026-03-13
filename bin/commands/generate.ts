import { Command } from "commander";
import { join } from "node:path";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate <app>")
    .description("Generate an agent-native CLI harness for any application (CLI-Anything pipeline)")
    .option("--deep", "Deep analysis of app capabilities")
    .option("--json", "Output as structured JSON")
    .option("--dry-run", "Preview without writing files")
    .option("--force", "Force regeneration even if cached")
    .option("--ai", "Enable AI-enhanced generation (requires API key)")
    .option("--output-dir <dir>", "Output directory for generated files")
    .option("--refine", "Run gap analysis on existing harness")
    .action(async (app: string, opts: { deep?: boolean; json?: boolean; dryRun?: boolean; force?: boolean; ai?: boolean; outputDir?: string; refine?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const { runCliAnythingPipeline, formatPipelineResult } = await import("../../lib/cli-anything/pipeline.js");

        const result = await runCliAnythingPipeline(
          {
            appName: app,
            deep: opts.deep ?? false,
            dryRun: opts.dryRun ?? false,
            force: opts.force ?? false,
            json: json,
            ai: opts.ai ?? false,
            tier: "free",
            outputDir: opts.outputDir ?? join(DATA_DIR, "generated"),
            orchestrate: false,
            refine: opts.refine,
          },
          (phase, name, status) => {
            if (!json && status === "start") {
              console.log(`  >> Phase ${phase}: ${name}`);
            }
          },
        );

        if (json) {
          emit(success("generate", {
            app: result.profile.name,
            installed: result.profile.installed,
            commands: result.design.commands.length,
            groups: result.design.groups.length,
            tests: result.testPlan.totalCount,
            quality: { overall: result.quality.overall, passed: result.quality.passed },
            outputDir: result.published.skillDir,
          }, start), true);
        } else {
          console.log(formatPipelineResult(result));
        }
      } catch (err) {
        const msg = toErrorMessage(err);
        if (json) { emit(failure("generate", "GENERATE_FAILED", msg, start), true); }
        else { console.error(`Generate failed: ${msg}`); process.exitCode = 1; }
      }
    });

  program
    .command("generate-all")
    .description("Full end-to-end pipeline: generate harnesses → skills → plugins → marketplace")
    .option("--deep", "Deep analysis of app capabilities")
    .option("--json", "Output as structured JSON")
    .option("--dry-run", "Preview without writing files")
    .option("--force", "Force regeneration even if cached")
    .option("--ai", "Enable AI-enhanced generation (requires API key)")
    .option("--limit <n>", "Limit number of apps to process", parseInt)
    .option("--domain <name>", "Filter by domain")
    .option("--output-dir <dir>", "Output directory for generated files")
    .action(async (opts: { deep?: boolean; json?: boolean; dryRun?: boolean; force?: boolean; ai?: boolean; limit?: number; domain?: string; outputDir?: string }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const { fullPipelineMode } = await import("../../examples/forge/mode-full-pipeline.js");
        const { setQuiet } = await import("../../examples/forge/helpers.js");
        setQuiet(json);

        const defaultArgs = (await import("../../examples/forge/parse-args.js")).parseArgs.call(null);
        const args = {
          ...defaultArgs,
          fullPipeline: true,
          deep: opts.deep ?? false,
          dryRun: opts.dryRun ?? false,
          force: opts.force ?? false,
          json: json,
          ai: opts.ai ?? false,
          limit: opts.limit ?? 0,
          domain: opts.domain ?? "",
          outputDir: opts.outputDir ?? "",
        };

        await fullPipelineMode(args, start);
      } catch (err) {
        const msg = toErrorMessage(err);
        if (json) { emit(failure("generate-all", "PIPELINE_FAILED", msg, start), true); }
        else { console.error(`Full pipeline failed: ${msg}`); process.exitCode = 1; }
      }
    });
}

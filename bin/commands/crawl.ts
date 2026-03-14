import { Command } from "commander";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { DATA_DIR, isJsonMode, getStore } from "./shared.js";

export function registerCrawlCommand(program: Command): void {
  const crawl = program
    .command("crawl")
    .description("Manage the crawl queue for batch skill discovery");

  // ── crawl seed ──────────────────────────────────────────────────────

  crawl
    .command("seed")
    .description("Seed the crawl queue from package registries")
    .option("--registry <name>", "Seed from specific registry (pypi, npm, crates, github, mcp)")
    .option("--all", "Seed from all registries")
    .option("--limit <n>", "Maximum items to seed per registry", "1000")
    .option("--category <names>", "Comma-separated category filter")
    .option("--min-quality <n>", "Minimum quality/stars threshold", "5")
    .option("--json", "Output as structured JSON")
    .option("--dry-run", "Show what would be seeded without inserting")
    .action(async (opts: {
      registry?: string;
      all?: boolean;
      limit?: string;
      category?: string;
      minQuality?: string;
      json?: boolean;
      dryRun?: boolean;
    }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const store = await getStore();

        const seederOpts = {
          limit: parseInt(opts.limit ?? "1000", 10),
          categories: opts.category?.split(",").map((s) => s.trim()),
          minQuality: parseInt(opts.minQuality ?? "5", 10),
        };

        if (opts.dryRun) {
          const result = success("crawl seed", {
            dryRun: true,
            registry: opts.all ? "all" : (opts.registry ?? "all"),
            limit: seederOpts.limit,
            categories: seederOpts.categories ?? "default",
          }, start);
          if (json) { emit(result, true); return; }
          console.log(`[dry-run] Would seed ${seederOpts.limit} items from ${opts.all ? "all registries" : opts.registry ?? "all"}`);
          return;
        }

        const seeders = await import("../../lib/crawler/seeders.js");
        let results;

        if (opts.all || !opts.registry) {
          results = await seeders.seedAll(store, seederOpts);
        } else {
          const fn = {
            pypi: seeders.seedFromPyPI,
            npm: seeders.seedFromNpm,
            crates: seeders.seedFromCrates,
            github: seeders.seedFromGitHub,
            mcp: seeders.seedFromMCPRegistry,
          }[opts.registry];

          if (!fn) {
            const result = failure("crawl seed", "INVALID_REGISTRY", `Unknown registry: ${opts.registry}`, start);
            if (json) { emit(result, true); return; }
            console.error(`Unknown registry: ${opts.registry}. Valid: pypi, npm, crates, github, mcp`);
            process.exitCode = 1;
            return;
          }

          results = [await fn(store, seederOpts)];
        }

        const totalSeeded = results.reduce((s, r) => s + r.seeded, 0);
        const result = success("crawl seed", { results, totalSeeded }, start);
        if (json) { emit(result, true); return; }

        for (const r of results) {
          console.log(`  ${r.registry}: ${r.seeded} seeded${r.errors.length > 0 ? ` (${r.errors.length} errors)` : ""}`);
        }
        console.log(`Total: ${totalSeeded} items seeded`);
      } catch (err) {
        const result = failure("crawl seed", "SEED_ERROR", toErrorMessage(err), start);
        if (json) { emit(result, true); return; }
        console.error(`Seed failed: ${toErrorMessage(err)}`);
        process.exitCode = 1;
      }
    });

  // ── crawl start ─────────────────────────────────────────────────────

  crawl
    .command("start")
    .description("Start processing the crawl queue")
    .option("--concurrency <n>", "Max concurrent tasks (default: CPU count)")
    .option("--limit <n>", "Max items to process")
    .option("--registry <name>", "Process only this registry")
    .option("--no-prune", "Keep installed package dirs after skill generation")
    .option("--dry-run", "Show what would be processed without running")
    .option("--json", "Output as structured JSON")
    .action(async (opts: {
      concurrency?: string;
      limit?: string;
      registry?: string;
      prune?: boolean;
      dryRun?: boolean;
      json?: boolean;
    }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      if (opts.dryRun) {
        try {
          const store = await getStore();
          const stats = store.crawlStats();
          const result = success("crawl start", {
            dryRun: true,
            pending: stats.pending,
            concurrency: opts.concurrency ? parseInt(opts.concurrency, 10) : "auto (CPU count)",
            limit: opts.limit ? parseInt(opts.limit, 10) : "unlimited",
            registry: opts.registry ?? "all",
            prune: opts.prune ?? true,
          }, start);
          if (json) { emit(result, true); return; }
          console.log(`[dry-run] Would process ${stats.pending} pending items`);
          return;
        } catch (err) {
          const result = failure("crawl start", "WORKER_ERROR", toErrorMessage(err), start);
          if (json) { emit(result, true); return; }
          console.error(`Worker failed: ${toErrorMessage(err)}`);
          process.exitCode = 1;
          return;
        }
      }

      try {
        const store = await getStore();

        const { runCrawlWorker } = await import("../../lib/crawler/worker.js");
        // Pre-load modules once outside the per-item callback
        const { validateSource } = await import("../../lib/guards.js");
        const { installTool, generateRichSkillMd } = await import("../../lib/skills.js");

        const workerResult = await runCrawlWorker(store, {
          concurrency: opts.concurrency ? parseInt(opts.concurrency, 10) : undefined,
          limit: opts.limit ? parseInt(opts.limit, 10) : undefined,
          registry: opts.registry,
          prune: opts.prune,
          dataDir: DATA_DIR,
          skillsDir: join(DATA_DIR, "generated-skills"),
          processItem: async (source, itemOpts) => {
            try {
              validateSource(source);

              const tool = await installTool(source, itemOpts.dataDir, {
                store,
                verbose: false,
                recursive: false,
              });

              const skillContent = generateRichSkillMd(tool);
              const skillDir = join(itemOpts.skillsDir, `src-${tool.id}`);
              mkdirSync(skillDir, { recursive: true });
              writeFileSync(join(skillDir, "SKILL.md"), skillContent, "utf-8");

              return { ok: true, skillId: tool.id };
            } catch (err) {
              return { ok: false, error: toErrorMessage(err) };
            }
          },
          onProgress: (stats) => {
            if (!json) {
              process.stdout.write(`\r  Processing: ${stats.processed} done, ${stats.succeeded} ok, ${stats.failed} failed, concurrency: ${stats.currentConcurrency}`);
            }
          },
        });

        if (!json) console.log(); // newline after progress
        const result = success("crawl start", workerResult, start);
        if (json) { emit(result, true); return; }

        console.log(`Processed: ${workerResult.processed}`);
        console.log(`Succeeded: ${workerResult.succeeded}`);
        console.log(`Failed: ${workerResult.failed}`);
        console.log(`Pruned: ${workerResult.prunedDirs} package dirs`);
        console.log(`Duration: ${(workerResult.durationMs / 1000).toFixed(1)}s`);

        if (workerResult.errors.length > 0) {
          console.log(`\nFirst ${Math.min(5, workerResult.errors.length)} errors:`);
          for (const e of workerResult.errors.slice(0, 5)) {
            console.log(`  ${e.source}: ${e.error}`);
          }
        }
      } catch (err) {
        const result = failure("crawl start", "WORKER_ERROR", toErrorMessage(err), start);
        if (json) { emit(result, true); return; }
        console.error(`Worker failed: ${toErrorMessage(err)}`);
        process.exitCode = 1;
      }
    });

  // ── crawl status ────────────────────────────────────────────────────

  crawl
    .command("status")
    .description("Show crawl queue statistics")
    .option("--json", "Output as structured JSON")
    .action(async (opts: { json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const store = await getStore();

        const stats = store.crawlStats();
        const total = stats.pending + stats.processing + stats.done + stats.failed;

        const result = success("crawl status", { ...stats, total }, start);
        if (json) { emit(result, true); return; }

        console.log(`Crawl Queue:`);
        console.log(`  Pending:    ${stats.pending}`);
        console.log(`  Processing: ${stats.processing}`);
        console.log(`  Done:       ${stats.done}`);
        console.log(`  Failed:     ${stats.failed}`);
        console.log(`  Total:      ${total}`);
      } catch (err) {
        const result = failure("crawl status", "STATUS_ERROR", toErrorMessage(err), start);
        if (json) { emit(result, true); return; }
        console.error(`Status failed: ${toErrorMessage(err)}`);
        process.exitCode = 1;
      }
    });
}

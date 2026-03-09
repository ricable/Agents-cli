/**
 * forge/mode-curated.ts — Curated tool registry → forge skills.
 */

import { join, resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { success, emit } from "../../lib/output.js";
import { loadAllTools, type CliTool } from "../../lib/curated-tools.js";
import type { CliArgs, BatchItem } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log, fmtTable } from "./helpers.js";
import { processBatch, buildIndexes } from "./stages.js";

/** Format a curated tool's source into a prefixed source string for the resolver. */
function formatSource(meta: CliTool): string {
  switch (meta.sourceType) {
    case "local": return meta.source;
    case "npm": return meta.source.startsWith("@") ? meta.source : `npm:${meta.source}`;
    case "pypi": return `pypi:${meta.source}`;
    case "github": return meta.source;
    default: {
      // Exhaustiveness check — compile error if a new sourceType is added without handling
      meta.sourceType satisfies never;
      return meta.source;
    }
  }
}

export async function curatedMode(args: CliArgs, startTime: number): Promise<void> {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const allTools = loadAllTools(projectRoot);

  if (!existsSync(join(projectRoot, "ai-ml-tools.json"))) {
    log("  Warning: ai-ml-tools.json not found — only general tools loaded.");
  }

  if (args.listCategories) {
    const cats = new Map<string, number>();
    for (const t of allTools) {
      cats.set(t.category, (cats.get(t.category) ?? 0) + 1);
    }
    log(`\n  ${allTools.length} tools across ${cats.size} categories:\n`);
    const sorted = [...cats.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [cat, count] of sorted) {
      log(`    ${cat.padEnd(35)} ${count} tools`);
    }
    log(`\n  Filter with: --category <name>  (partial match, e.g. "ai-ml" or "security")\n`);
    if (args.json) {
      emit(success("skill-forge:curated", {
        total: allTools.length,
        categories: Object.fromEntries(sorted),
      }, startTime), true);
    }
    return;
  }

  let tools = allTools;
  if (args.category) {
    tools = tools.filter(t => t.category.toLowerCase().includes(args.category));
  }
  if (args.limit > 0) {
    tools = tools.slice(0, args.limit);
  }

  log(`  Mode:     curated`);
  log(`  Tools:    ${tools.length} / ${allTools.length}`);
  if (args.category) log(`  Category: ${args.category}`);
  log(`  Dry run:  ${args.dryRun}`);
  log("");

  const categories = new Map<string, CliTool[]>();
  for (const t of tools) {
    if (!categories.has(t.category)) categories.set(t.category, []);
    categories.get(t.category)!.push(t);
  }

  for (const [cat, catTools] of categories) {
    log(`  ${cat} (${catTools.length})`);
    for (const t of catTools) {
      const srcLabel = formatSource(t);
      log(`    ${t.name.padEnd(16)} ${srcLabel.padEnd(35)} ${t.description.slice(0, 50)}`);
    }
    log("");
  }

  if (args.dryRun) {
    log(`  Dry run complete. ${tools.length} tools would be processed.`);
    if (args.json) {
      emit(success("skill-forge:curated", {
        tools: tools.map(t => ({ name: t.name, source: t.source, category: t.category })),
        total: tools.length,
      }, startTime), true);
    }
    return;
  }

  const skipped: CliTool[] = [];
  const toProcess: CliTool[] = [];
  for (const meta of tools) {
    if (args.skipInstalled && existsSync(join(OUTPUT_DIR, meta.name, "SKILL.md"))) {
      log(`  Skipping ${meta.name} (already has SKILL.md)`);
      skipped.push(meta);
    } else {
      toProcess.push(meta);
    }
  }

  const metaMap = new Map(toProcess.map(m => [m.name, m]));
  const batchItems: BatchItem[] = toProcess.map(meta => ({
    label: meta.name,
    source: formatSource(meta),
    curatedMeta: {
      description: meta.description,
      agentValue: meta.agentValue,
      category: meta.category,
    },
  }));

  const { results, failures } = await processBatch(batchItems, { deep: args.deep, noCache: args.noCache, force: args.force });

  if (results.length > 0) {
    log("\n  Building indexes...");
    await buildIndexes(results.map(r => r.tool), false);
  }

  log("\n  ═══════════════════════════════════════════════════════");
  log("  Curated Pipeline Summary");
  log("  ═══════════════════════════════════════════════════════");
  log(`  Processed: ${results.length} | Failed: ${failures.length} | Skipped: ${skipped.length}`);

  if (results.length > 0) {
    const rows = results.map(r => {
      const meta = metaMap.get(r.label);
      return [
        r.tool.meta.name.slice(0, 25),
        meta?.category ?? "",
        `${r.tool.capabilities.commands.length}`,
        r.quality.triggerScore.toFixed(2),
        r.quality.passed ? "PASS" : "FAIL",
      ];
    });
    log(fmtTable(rows, ["Skill", "Category", "Cmds", "Trigger", "Status"]));
  }

  if (args.json) {
    emit(success("skill-forge:curated", {
      processed: results.length,
      failed: failures.length,
      skipped: skipped.length,
      results: results.map(r => ({
        name: r.tool.meta.name,
        category: metaMap.get(r.label)?.category ?? "",
        commands: r.tool.capabilities.commands.length,
        quality: r.quality,
      })),
    }, startTime), true);
  }
}

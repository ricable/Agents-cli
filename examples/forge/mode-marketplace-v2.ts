/**
 * forge/mode-marketplace-v2.ts — Enhanced marketplace mode using bundler + catalog.
 *
 * Scans generated skills for CLI-Anything outputs, bundles each into
 * marketplace-ready packages, generates a unified catalog, and displays
 * a summary with pricing.
 *
 * Usage:
 *   npx tsx examples/skill-forge.ts --marketplace-v2 [--dry-run] [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { success, failure, emit } from "../../lib/output.js";
import { bundleForMarketplace } from "../../lib/marketplace/bundler.js";
import { generateCatalog } from "../../lib/marketplace/catalog.js";
import { DEFAULT_PRICING, getSuggestedPrice, calculatePayout } from "../../lib/marketplace/pricing.js";
import type { CliAnythingResult } from "../../lib/cli-anything/types.js";
import type { BundleManifest } from "../../lib/marketplace/bundler.js";
import type { CatalogEntry } from "../../lib/marketplace/catalog.js";
import type { CliArgs } from "./types.js";
import { log } from "./helpers.js";
import { OUTPUT_DIR } from "./types.js";

interface MarketplaceV2Result {
  bundleCount: number;
  catalogEntries: number;
  bundles: BundleManifest[];
  catalog: CatalogEntry[];
  outputDir: string;
}

/**
 * Enhanced marketplace mode: bundle + catalog + pricing.
 */
export async function marketplaceV2Mode(args: CliArgs, startTime: number): Promise<void> {
  log("  Mode: Marketplace v2 (Bundle + Catalog + Pricing)");
  log("");

  const skillsDir = path.resolve(args.outputDir || OUTPUT_DIR);
  const outputDir = path.resolve(args.outputDir || "marketplace-v2");
  const bundlesDir = path.join(outputDir, "bundles");
  const pluginsDir = path.resolve("plugins");
  const catalogPath = path.join(outputDir, "marketplace.json");

  if (!fs.existsSync(skillsDir)) {
    if (args.json) {
      emit(failure("marketplace-v2", "NO_SKILLS", `Skills directory not found: ${skillsDir}`, startTime), true);
    } else {
      log(`  ERROR: Skills directory not found: ${skillsDir}`);
      log("  Run --cli-anything or --curated first to generate skills.");
    }
    return;
  }

  // 1. Scan for CLI-Anything harness outputs (look for bundles.json or harness files)
  const allBundles: BundleManifest[] = [];
  const harnessResults = discoverCliAnythingResults(skillsDir);

  if (harnessResults.length > 0) {
    log(`  Found ${harnessResults.length} CLI-Anything harness result(s)`);
    log("");

    for (const result of harnessResults) {
      if (args.dryRun) {
        log(`  [dry-run] Would bundle: ${result.design.packageName}`);
        continue;
      }

      const appBundleDir = path.join(bundlesDir, result.design.packageName);
      const bundles = bundleForMarketplace({
        result,
        outputDir: appBundleDir,
        includeSkill: true,
        includePlugin: true,
        includeHooks: true,
        includeAgents: true,
      });

      allBundles.push(...bundles);
      log(`  Bundled: ${result.design.packageName} → ${bundles.length} packages`);
      for (const b of bundles) {
        const pricing = DEFAULT_PRICING[b.productType];
        const price = pricing
          ? getSuggestedPrice(b.productType, result.design.commands.length, result.testPlan.totalCount)
          : 0;
        log(`    ${b.productType.padEnd(12)} ${b.name.padEnd(35)} $${price.toFixed(2)}`);
      }
    }
    log("");
  } else {
    log("  No CLI-Anything harness results found — scanning skills + plugins only");
    log("");
  }

  // 2. Generate unified catalog from skills + plugins
  log("  Generating unified catalog...");
  const catalog = await generateCatalog({
    skillsDir,
    pluginsDir,
    outputPath: catalogPath,
    dryRun: args.dryRun,
  });

  log(`  Catalog: ${catalog.length} entries`);

  // 3. Display pricing summary
  if (!args.json) {
    log("");
    log("  ┌─────────────────────────────────────────────────────────┐");
    log("  │                  Marketplace v2 Summary                  │");
    log("  └─────────────────────────────────────────────────────────┘");
    log("");

    // Bundle summary
    if (allBundles.length > 0) {
      log("  Bundles:");
      const byType = new Map<string, number>();
      for (const b of allBundles) {
        byType.set(b.productType, (byType.get(b.productType) ?? 0) + 1);
      }
      for (const [type, count] of byType) {
        log(`    ${type.padEnd(14)} ${count}`);
      }
      log("");
    }

    // Catalog summary
    log("  Catalog Entries by Type:");
    const catByType = new Map<string, number>();
    for (const e of catalog) {
      catByType.set(e.productType, (catByType.get(e.productType) ?? 0) + 1);
    }
    for (const [type, count] of catByType) {
      const pricing = DEFAULT_PRICING[type];
      const label = pricing ? `$${pricing.basePrice.toFixed(2)} base` : "free";
      log(`    ${type.padEnd(14)} ${String(count).padEnd(5)} (${label})`);
    }
    log("");

    // Revenue projection (if any paid products)
    const paidEntries = catalog.filter(e => e.pricing.model === "paid");
    if (paidEntries.length > 0) {
      let totalRevenue = 0;
      for (const e of paidEntries) {
        totalRevenue += e.pricing.basePrice;
      }
      const payout = calculatePayout(totalRevenue, { creator: 80, platform: 20 });
      log("  Revenue Projection (if all sold once):");
      log(`    Total:     $${totalRevenue.toFixed(2)}`);
      log(`    Creator:   $${payout.creatorAmount.toFixed(2)} (80%)`);
      log(`    Platform:  $${payout.platformAmount.toFixed(2)} (20%)`);
      log("");
    }

    if (args.dryRun) {
      log("  [dry-run] No files written.");
    } else {
      log(`  Output: ${outputDir}`);
      if (fs.existsSync(catalogPath)) {
        log(`  Catalog: ${catalogPath}`);
      }
    }
    log("");
  }

  // 4. Emit structured output
  if (args.json) {
    const result: MarketplaceV2Result = {
      bundleCount: allBundles.length,
      catalogEntries: catalog.length,
      bundles: allBundles,
      catalog,
      outputDir,
    };
    emit(success("marketplace-v2", result, startTime), true);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Discover CLI-Anything results by scanning for harness marker files.
 *
 * Looks for directories that contain both a SKILL.md and a companion
 * *-harness directory with Python files (the CLI-Anything pattern).
 * Reconstructs a minimal CliAnythingResult from the on-disk artifacts.
 */
function discoverCliAnythingResults(skillsDir: string): CliAnythingResult[] {
  const results: CliAnythingResult[] = [];

  if (!fs.existsSync(skillsDir)) return results;

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const entry of entries) {
    // Look for *-harness companion directories
    if (!entry.name.endsWith("-harness")) continue;

    const pkgName = entry.name.replace(/-harness$/, "");
    const skillDir = path.join(skillsDir, pkgName);
    const harnessDir = path.join(skillsDir, entry.name);

    // Must have both skill and harness directories
    if (!fs.existsSync(skillDir) || !fs.existsSync(path.join(skillDir, "SKILL.md"))) continue;

    // Reconstruct a minimal CliAnythingResult from on-disk artifacts
    const skillMd = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf-8");

    // Extract info from SKILL.md frontmatter
    const fm = extractMinimalFrontmatter(skillMd);

    // Collect harness files
    const harnessFiles = collectFiles(harnessDir, harnessDir);

    // Collect reference files
    const references: Record<string, string> = {};
    const refsDir = path.join(skillDir, "references");
    if (fs.existsSync(refsDir)) {
      for (const ref of fs.readdirSync(refsDir)) {
        const refPath = path.join(refsDir, ref);
        if (fs.statSync(refPath).isFile()) {
          references[`references/${ref}`] = fs.readFileSync(refPath, "utf-8");
        }
      }
    }

    // Build minimal result
    const result: CliAnythingResult = {
      profile: {
        name: pkgName,
        displayName: fm.name || pkgName,
        version: fm.version || "0.1.0",
        installed: true,
        installHint: `uv pip install -e ${pkgName}/`,
        scriptable: true,
        backendType: "subprocess",
        apiSurface: [],
        bindings: [],
        category: (fm.domain as import("../../lib/cli-anything/types.js").AppCategory) || "generic",
        binaryPath: "",
      },
      design: {
        packageName: pkgName,
        commands: [],
        groups: [],
        replConfig: { banner: "", prompt: "> ", historyFile: "", undoSupport: false },
        outputSchema: { ok: "boolean", command: "string", data: "object", meta: { version: "string", duration: "number", timestamp: "string" } },
      },
      bundle: {
        packageName: pkgName,
        files: harnessFiles.map(f => ({ path: f.relativePath, content: f.content })),
        design: { packageName: pkgName, commands: [], groups: [], replConfig: { banner: "", prompt: "> ", historyFile: "", undoSupport: false }, outputSchema: { ok: "boolean", command: "string", data: "object", meta: { version: "string", duration: "number", timestamp: "string" } } },
        profile: { name: pkgName, displayName: pkgName, version: "0.1.0", installed: true, installHint: "", scriptable: true, backendType: "subprocess", apiSurface: [], bindings: [], category: "generic", binaryPath: "" },
        entryPoint: "cli.py",
      },
      testPlan: { tests: [], totalCount: 0, byCategory: { unit: 0, integration: 0, e2e: 0, docker: 0 } },
      testSuite: { files: [], runCommand: "pytest tests/ -v", markers: [] },
      docs: { readme: "", changelog: "", references },
      quality: { axes: [], overall: 70, passed: true },
      published: { skillMd, skillDir, mcpRegistered: false, storeRegistered: false },
      phases: [],
    };

    results.push(result);
  }

  return results;
}

function extractMinimalFrontmatter(content: string): {
  name?: string;
  version?: string;
  domain?: string;
} {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return {};
  const fm = fmMatch[1]!;
  return {
    name: fm.match(/^name:\s*(.+)$/m)?.[1]?.trim(),
    version: fm.match(/^version:\s*(.+)$/m)?.[1]?.trim(),
    domain: fm.match(/^domain:\s*(.+)$/m)?.[1]?.trim(),
  };
}

function collectFiles(
  dir: string,
  baseDir: string,
): Array<{ relativePath: string; content: string }> {
  const results: Array<{ relativePath: string; content: string }> = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;

    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        results.push({
          relativePath: path.relative(baseDir, fullPath),
          content,
        });
      } catch {
        // Skip binary files
      }
    }
  }
  return results;
}

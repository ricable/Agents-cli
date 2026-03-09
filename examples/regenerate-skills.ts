#!/usr/bin/env npx tsx
/**
 * regenerate-skills.ts
 *
 * Regenerate all SKILL.md files in examples/generated-skills/ using
 * the updated generateRichSkillMd() / generateSkillDirectory() without
 * re-downloading or cloning any repos.
 *
 * Reads tool metadata from ~/.agents-cli/tools.json and matches each
 * existing skill directory to its stored tool object.
 *
 * Usage:
 *   npx tsx examples/regenerate-skills.ts [--dry-run] [--verbose]
 */

import { generateRichSkillMd, generateSkillDirectory, parseFrontmatter } from "../lib/skills.js";
import { generateContextMd } from "../lib/store.js";
import type { Tool, SkillDirectory } from "../lib/types.js";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";

const TOOLS_JSON = join(homedir(), ".agents-cli", "tools.json");
const OUTPUT_DIR = resolve("examples/generated-skills");

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    verbose: args.includes("--verbose") || args.includes("-v"),
  };
}

function loadTools(): Tool[] {
  if (!existsSync(TOOLS_JSON)) {
    console.error(`tools.json not found at ${TOOLS_JSON}`);
    process.exitCode = 1;
    return [];
  }
  return JSON.parse(readFileSync(TOOLS_JSON, "utf-8")) as Tool[];
}

function buildLookups(tools: Tool[]) {
  const byName = new Map<string, Tool>();
  const byId = new Map<string, Tool>();
  const bySourceUri = new Map<string, Tool>();

  for (const t of tools) {
    byName.set(t.meta.name, t);
    byId.set(t.id, t);
    bySourceUri.set(t.source.uri, t);
  }

  return { byName, byId, bySourceUri };
}

/** Find the tool for a skill directory — tries name, id, scoped name, then ingredients from frontmatter */
function findTool(
  dirName: string,
  fm: ReturnType<typeof parseFrontmatter> | null,
  lookups: ReturnType<typeof buildLookups>,
): Tool | null {
  // Direct match by name or id
  if (lookups.byName.has(dirName)) return lookups.byName.get(dirName)!;
  if (lookups.byId.has(dirName)) return lookups.byId.get(dirName)!;

  // For nested dirs like @ai-sdk/openai, try @ai-sdk/openai as name/id
  if (dirName.includes("/")) {
    const scoped = dirName;
    if (lookups.byName.has(scoped)) return lookups.byName.get(scoped)!;
    if (lookups.byId.has(scoped)) return lookups.byId.get(scoped)!;
    const last = dirName.split("/").pop()!;
    if (lookups.byName.has(last)) return lookups.byName.get(last)!;
    if (lookups.byId.has(last)) return lookups.byId.get(last)!;
  }

  if (!fm) return null;

  // Try frontmatter name
  if (fm.name && lookups.byName.has(fm.name)) return lookups.byName.get(fm.name)!;
  if (fm.name && lookups.byId.has(fm.name)) return lookups.byId.get(fm.name)!;

  // Try each ingredient as a source URI
  for (const ing of fm.ingredients) {
    if (lookups.bySourceUri.has(ing)) return lookups.bySourceUri.get(ing)!;
  }

  return null;
}

/** Check if a skill is a "workflow" or "recipe" (multi-tool, no single backing tool) */
function isWorkflowSkill(dirName: string, fm: ReturnType<typeof parseFrontmatter> | null): boolean {
  if (dirName.endsWith("-workflow") || dirName.endsWith("-recipe")) return true;
  return fm !== null && fm.ingredients.length > 1;
}

function writeSkillDirectory(dir: string, result: SkillDirectory, dryRun: boolean) {
  if (!dryRun) {
    writeFileSync(join(dir, "SKILL.md"), result.skillMd, "utf-8");
  }

  // Write reference files
  for (const [relPath, content] of Object.entries(result.files)) {
    const fullPath = join(dir, relPath);
    if (!dryRun) {
      mkdirSync(join(fullPath, ".."), { recursive: true });
      writeFileSync(fullPath, content, "utf-8");
    }
  }
}

async function main() {
  const opts = parseArgs();
  const tools = loadTools();
  if (tools.length === 0) return;

  const lookups = buildLookups(tools);

  // Get all skill directories, including nested ones like @ai-sdk/openai
  const dirs: string[] = [];
  for (const entry of readdirSync(OUTPUT_DIR)) {
    const fullPath = join(OUTPUT_DIR, entry);
    try {
      if (!statSync(fullPath).isDirectory()) continue;
    } catch { continue; }

    // Check if this directory has a SKILL.md directly
    if (existsSync(join(fullPath, "SKILL.md"))) {
      dirs.push(entry);
    } else {
      // Check for nested skill dirs (e.g. @ai-sdk/openai/)
      for (const sub of readdirSync(fullPath)) {
        const subPath = join(fullPath, sub);
        try {
          if (statSync(subPath).isDirectory() && existsSync(join(subPath, "SKILL.md"))) {
            dirs.push(join(entry, sub));
          }
        } catch { /* skip */ }
      }
    }
  }

  console.log(`Regenerating ${dirs.length} skills from ${tools.length} stored tools`);
  if (opts.dryRun) console.log("(dry run — no files will be written)\n");

  let regenerated = 0;
  let skippedWorkflows = 0;
  let noMatch = 0;
  const failures: string[] = [];
  let maxLines = 0;
  let maxName = "";
  let over300 = 0;

  for (const dirName of dirs) {
    const skillDir = join(OUTPUT_DIR, ...dirName.split("/"));
    const skillPath = join(skillDir, "SKILL.md");

    // Parse frontmatter once — reuse for both workflow check and tool lookup
    const fm = existsSync(skillPath) ? parseFrontmatter(readFileSync(skillPath, "utf-8")) : null;

    // Skip workflow/recipe skills — they combine multiple tools
    if (isWorkflowSkill(dirName, fm)) {
      skippedWorkflows++;
      if (opts.verbose) console.log(`  SKIP workflow: ${dirName}`);
      continue;
    }

    // Find the backing tool
    const tool = findTool(dirName, fm, lookups);
    if (!tool) {
      noMatch++;
      if (opts.verbose) console.log(`  NO MATCH: ${dirName}`);
      failures.push(dirName);
      continue;
    }

    // Generate new skill
    const result = generateSkillDirectory(tool);
    const lineCount = result.skillMd.split("\n").length;
    const refCount = Object.keys(result.files).length;

    // Track line counts during generation (no re-read needed)
    if (lineCount > 300) over300++;
    if (lineCount > maxLines) { maxLines = lineCount; maxName = dirName; }

    writeSkillDirectory(skillDir, result, opts.dryRun);

    // Also regenerate CONTEXT.md
    if (!opts.dryRun) {
      writeFileSync(join(skillDir, "CONTEXT.md"), generateContextMd(tool), "utf-8");
    }

    regenerated++;
    if (opts.verbose) {
      console.log(`  OK: ${dirName} (${lineCount} lines, ${refCount} refs)`);
    }
  }

  // Summary
  console.log(`\nDone.`);
  console.log(`  Regenerated: ${regenerated}`);
  console.log(`  Skipped (workflows): ${skippedWorkflows}`);
  console.log(`  No match: ${noMatch}`);

  if (failures.length > 0 && opts.verbose) {
    console.log(`\n  Unmatched directories:`);
    for (const f of failures) console.log(`    - ${f}`);
  }

  // Line count audit (accumulated during generation — no re-read needed)
  if (regenerated > 0) {
    console.log(`\n  Line count audit:`);
    console.log(`    Max: ${maxName} (${maxLines} lines)`);
    console.log(`    Over 300 lines: ${over300}`);
  }
}

main().catch(err => {
  console.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});

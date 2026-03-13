import { Command } from "commander";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createStore } from "../../lib/store.js";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import {
  parseFrontmatter,
  buildContext,
  generateSkillMd,
  generateRichSkillMd,
  installSkill,
  listSkills,
  removeSkill,
} from "../../lib/skills.js";
import type { Tool, ManifestEntry } from "../../lib/types.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerSkillsCommand(program: Command): void {
  const skills = program
    .command("skills")
    .description("Manage skills (SKILL.md bundles of tools)");

  skills
    .command("install <path>")
    .description("Install a skill from a SKILL.md file path")
    .option("--json", "Output as structured JSON")
    .option("--dry-run", "Show what would be installed without installing")
    .action(async (skillPath: string, opts: { json?: boolean; dryRun?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const resolved = resolve(skillPath);

      if (!existsSync(resolved)) {
        const result = failure("skills install", "NOT_FOUND", `SKILL.md not found: ${resolved}`, start);
        emit(result, json);
        if (!json) console.error(result.error!.message);
        return;
      }

      if (opts.dryRun) {
        const content = readFileSync(resolved, "utf-8");
        const frontmatter = parseFrontmatter(content);
        if (!frontmatter) {
          emit(failure("skills install", "PARSE_FAILED", "Failed to parse SKILL.md frontmatter", start), json);
          return;
        }
        const data = { action: "install", path: resolved, ...frontmatter };
        if (json) { emit(success("skills install", data, start), true); }
        else {
          console.log(`Would install skill: ${frontmatter.name}@${frontmatter.version}`);
          console.log(`  Ingredients: ${frontmatter.ingredients.join(", ")}`);
        }
        return;
      }

      try {
        if (!json) console.log(`Installing skill from ${resolved}...`);
        const skill = await installSkill(resolved, DATA_DIR);

        if (json) {
          emit(success("skills install", {
            name: skill.frontmatter.name,
            version: skill.frontmatter.version,
            ingredients: skill.ingredients.map(t => ({ name: t.meta.name, version: t.meta.version })),
            contextPath: skill.contextPath,
          }, start), true);
        } else {
          console.log(`\nSkill "${skill.frontmatter.name}" installed successfully`);
          console.log(`  Version: ${skill.frontmatter.version}`);
          console.log(`  Ingredients: ${skill.ingredients.length}`);
          for (const tool of skill.ingredients) {
            console.log(`    - ${tool.meta.name}@${tool.meta.version}`);
          }
          console.log(`  Context: ${skill.contextPath}`);
        }
      } catch (err) {
        const msg = toErrorMessage(err);
        const result = failure("skills install", "SKILL_INSTALL_FAILED", msg, start);
        emit(result, json);
        if (!json) { console.error(`Skill install failed: ${msg}`); process.exitCode = 1; }
      }
    });

  skills
    .command("generate <name>")
    .description("Generate a SKILL.md — from an installed tool (--from-tool) or as scaffold")
    .option("-d, --description <desc>", "Skill description", "A new skill")
    .option("--from-tool <tool>", "Generate rich SKILL.md from an installed tool's capabilities")
    .option("--json", "Output as structured JSON")
    .action(async (name: string, opts: { description: string; fromTool?: string; json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      const store = createStore(DATA_DIR);
      const toolKey = opts.fromTool ?? name;
      const tool = await store.get(toolKey);

      if (opts.fromTool) {
        if (!tool) {
          emit(failure("skills generate", "NOT_FOUND", `Tool not found: ${opts.fromTool}`, start), json);
          return;
        }

        const content = generateRichSkillMd(tool);
        const outPath = resolve(`${name}.SKILL.md`);
        writeFileSync(outPath, content, "utf-8");

        if (json) {
          emit(success("skills generate", { path: outPath, fromTool: opts.fromTool, lines: content.split("\n").length }, start), true);
        } else {
          console.log(`Generated rich SKILL.md from ${opts.fromTool}: ${outPath}`);
          console.log(`  ${content.split("\n").length} lines`);
        }
      } else {
        if (tool) {
          const content = generateRichSkillMd(tool);
          const outPath = resolve(`${name}.SKILL.md`);
          writeFileSync(outPath, content, "utf-8");
          if (json) {
            emit(success("skills generate", { path: outPath, fromTool: name, lines: content.split("\n").length }, start), true);
          } else {
            console.log(`Generated rich SKILL.md from installed tool "${name}": ${outPath}`);
            console.log(`  ${content.split("\n").length} lines`);
          }
        } else {
          // Fallback: scaffold a blank SKILL.md (no installed tool to analyze)
          if (!json) console.log(`  ⚠ Tool "${name}" not installed — generating basic scaffold. Use --from-tool or install first for a rich skill.`);
          const content = generateSkillMd(name, opts.description);
          const outPath = resolve("SKILL.md");
          writeFileSync(outPath, content, "utf-8");
          if (json) {
            emit(success("skills generate", { path: outPath, rich: false }, start), true);
          } else {
            console.log(`Generated ${outPath}`);
          }
        }
      }
    });

  skills
    .command("context <path>")
    .description("Build and display the assembled context for a skill")
    .option("--json", "Output as structured JSON")
    .action(async (skillPath: string, opts: { json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const resolved = resolve(skillPath);

      if (!existsSync(resolved)) {
        emit(failure("skills context", "NOT_FOUND", `SKILL.md not found: ${resolved}`, start), json);
        return;
      }

      const content = readFileSync(resolved, "utf-8");
      const frontmatter = parseFrontmatter(content);
      if (!frontmatter) {
        emit(failure("skills context", "PARSE_FAILED", "Failed to parse SKILL.md frontmatter", start), json);
        return;
      }

      const store = createStore(DATA_DIR);
      const tools: Tool[] = [];
      for (const ingredient of frontmatter.ingredients) {
        const toolId = ingredient.replace(/[/@]/g, "-").replace(/^-/, "");
        const tool = await store.get(toolId);
        if (tool) tools.push(tool);
      }

      const bodyMatch = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/.exec(content);
      const body = bodyMatch?.[1]?.trim() ?? "";

      const { discoverResources } = await import("../../lib/skills.js");
      const { dirname } = await import("node:path");
      const resources = discoverResources(dirname(resolved));

      const skill = {
        frontmatter,
        body,
        ingredients: tools,
        contextPath: join(DATA_DIR, "skills", frontmatter.name, "CONTEXT.md"),
        resources,
      };

      const contextMd = buildContext(skill);
      if (json) {
        emit(success("skills context", { context: contextMd, frontmatter, toolCount: tools.length }, start), true);
      } else {
        console.log(contextMd);
      }
    });

  skills
    .command("list")
    .description("List all installed skills")
    .option("--json", "Output as structured JSON")
    .action((opts: { json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const installed = listSkills(DATA_DIR);

      if (json) {
        emit(success("skills list", { skills: installed, total: installed.length }, start), true);
        return;
      }

      if (installed.length === 0) {
        console.log("No skills installed.");
        return;
      }
      console.log(`\n  Installed skills (${installed.length}):\n`);
      for (const skill of installed) {
        const tags = skill.tags.length > 0 ? ` [${skill.tags.join(", ")}]` : "";
        console.log(`  ${skill.name}@${skill.version}${tags}`);
        if (skill.description) console.log(`    ${skill.description}`);
        console.log(`    Tools: ${skill.toolIds.join(", ") || "none"}`);
        const res = skill.resources;
        if (res.scripts || res.references || res.assets) {
          console.log(`    Resources: ${res.scripts} scripts, ${res.references} references, ${res.assets} assets`);
        }
      }
      console.log();
    });

  skills
    .command("remove <name>")
    .description("Remove an installed skill")
    .option("--with-tools", "Also remove the skill's tools")
    .option("--json", "Output as structured JSON")
    .option("--dry-run", "Show what would be removed without removing")
    .action(async (name: string, opts: { withTools?: boolean; json?: boolean; dryRun?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      if (opts.dryRun) {
        const data = { action: "remove", name, withTools: opts.withTools ?? false };
        if (json) { emit(success("skills remove", data, start), true); }
        else { console.log(`Would remove skill: ${name}${opts.withTools ? " and its tools" : ""}`); }
        return;
      }

      const removed = await removeSkill(name, DATA_DIR, { removeTools: opts.withTools });
      if (json) {
        emit(success("skills remove", { name, removed }, start), true);
      } else if (removed) {
        console.log(`Removed skill "${name}"${opts.withTools ? " and its tools" : ""}`);
      } else {
        console.error(`Skill not found: ${name}`);
        process.exitCode = 1;
      }
    });

  skills
    .command("test [dir]")
    .description("Test skill quality (trigger scoring + structural quality)")
    .option("--strict", "Fail if any skill doesn't pass quality gate")
    .option("--domain <domain>", "Filter by domain")
    .option("--json", "Output as structured JSON")
    .action(async (dir: string | undefined, opts: { strict?: boolean; domain?: string; json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const { testAllSkillsSync } = await import("../../lib/skill-tester.js");
        const skillsDir = dir ? resolve(dir) : join(DATA_DIR, "skills");

        if (!existsSync(skillsDir)) {
          const result = failure("skills test", "DIR_NOT_FOUND", `Skills directory not found: ${skillsDir}`, start);
          emit(result, json);
          if (!json) console.error(result.error!.message);
          return;
        }

        const results = testAllSkillsSync(skillsDir, opts.domain);

        if (json) {
          emit(success("skills test", { results, total: results.length }, start), true);
        } else {
          const { printQualityReport } = await import("../../lib/skill-tester.js");
          printQualityReport(results);
        }

        if (opts.strict) {
          const failing = results.filter(r => !r.passed);
          if (failing.length > 0) {
            if (!json) console.error(`\n${failing.length} skill(s) below quality gate (0.5)`);
            process.exitCode = 1;
          }
        }
      } catch (err) {
        const msg = toErrorMessage(err);
        if (json) { emit(failure("skills test", "TEST_FAILED", msg, start), true); }
        else { console.error(`Skill test failed: ${msg}`); process.exitCode = 1; }
      }
    });

  skills
    .command("group")
    .description("Group skills by domain and generate hierarchical indexes")
    .option("--dir <path>", "Skills directory")
    .option("--json", "Output as structured JSON")
    .action(async (opts: { dir?: string; json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const { groupByDomain } = await import("../../lib/indexes.js");
        const { readdirSync } = await import("node:fs");

        const dir = opts.dir ? resolve(opts.dir) : join(DATA_DIR, "skills");

        if (!existsSync(dir)) {
          const result = failure("skills group", "DIR_NOT_FOUND", `Skills directory not found: ${dir}`, start);
          emit(result, json);
          if (!json) console.error(result.error!.message);
          return;
        }

        // Scan for SKILL.md files and extract manifest entries
        const { parseFrontmatter: parseFm } = await import("../../lib/skills.js");
        const entries: ManifestEntry[] = [];
        const items = readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
          if (!item.isDirectory()) continue;
          if (item.name.startsWith("_") || item.name.startsWith(".")) continue;
          const skillPath = join(dir, item.name, "SKILL.md");
          if (!existsSync(skillPath)) continue;
          const content = readFileSync(skillPath, "utf-8");
          const fm = parseFm(content);
          if (fm) {
            entries.push({
              name: fm.name,
              repo: "",
              domain: fm.domain ?? "uncategorized",
              description: fm.description ?? "",
            });
          }
        }

        const grouped = groupByDomain(entries);
        const domainCount = grouped.size;

        if (json) {
          const domains: Record<string, number> = {};
          for (const [domain, items] of grouped) {
            domains[domain] = items.length;
          }
          emit(success("skills group", { domains, totalSkills: entries.length, domainCount }, start), true);
        } else {
          console.log(`\nGrouped ${entries.length} skills into ${domainCount} domains:\n`);
          for (const [domain, items] of grouped) {
            console.log(`  ${domain} (${items.length})`);
          }
          console.log();
        }
      } catch (err) {
        const msg = toErrorMessage(err);
        if (json) { emit(failure("skills group", "GROUP_FAILED", msg, start), true); }
        else { console.error(`Skills grouping failed: ${msg}`); process.exitCode = 1; }
      }
    });

  skills
    .command("factory")
    .description("Run 3-layer skill factory (structural + optional AI)")
    .option("--manifest <path>", "Path to skills-manifest.json")
    .option("--domain <name>", "Filter by domain")
    .option("--repo <name>", "Filter by repo")
    .option("--ai", "Enable Layer 3 (Claude Batch API)")
    .option("--force", "Force regeneration")
    .option("--dry-run", "Preview without writing")
    .option("--json", "Output as structured JSON")
    .action(async (opts: { manifest?: string; domain?: string; repo?: string; ai?: boolean; force?: boolean; dryRun?: boolean; json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const { runSkillFactory } = await import("../../lib/skill-factory.js");

        const factoryOpts = {
          manifestPath: opts.manifest ?? join(DATA_DIR, "skills-manifest.json"),
          skillsDir: join(DATA_DIR, "skills"),
          opensrcDir: join(DATA_DIR, "opensrc"),
          domain: opts.domain,
          repo: opts.repo,
          ai: opts.ai,
          force: opts.force,
          dryRun: opts.dryRun,
        };

        const result = await runSkillFactory(factoryOpts);

        if (json) {
          emit(success("skills factory", result, start), true);
        } else {
          console.log(opts.dryRun ? `Skill factory (dry-run):` : `Skill factory complete.`);
          console.log(`  Generated: ${result.generated}`);
          console.log(`  Skipped: ${result.skipped}`);
          console.log(`  Total: ${result.total}`);
          console.log(`  Domains: ${result.domains.join(", ") || "none"}`);
          if (result.errors.length > 0) {
            console.log(`  Errors: ${result.errors.length}`);
            for (const e of result.errors) console.log(`    - ${e}`);
          }
        }
      } catch (err) {
        const msg = toErrorMessage(err);
        if (json) { emit(failure("skills factory", "FACTORY_FAILED", msg, start), true); }
        else { console.error(`Skill factory failed: ${msg}`); process.exitCode = 1; }
      }
    });
}

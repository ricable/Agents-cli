import { Command } from "commander";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { createResolver } from "../../lib/resolver.js";
import { createStore, getToolInstallDir } from "../../lib/store.js";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { validateSource, InputValidationError } from "../../lib/guards.js";
import { generateRichSkillMd, installTool } from "../../lib/skills.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerAddCommand(program: Command): void {
  program
    .command("add <source>")
    .description("Install a tool from a source identifier (owner/repo, @scope/pkg, pypi:name, crates:name, or ./path)")
    .option("-f, --force", "Force reinstall if already installed")
    .option("--json", "Output as structured JSON")
    .option("--dry-run", "Show what would be installed without installing")
    .option("--deep", "Deep-probe subcommands recursively after install")
    .option("--no-skill", "Skip auto-generating SKILL.md after install")
    .action(async (source: string, opts: { force?: boolean; json?: boolean; dryRun?: boolean; deep?: boolean; skill?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        validateSource(source);
      } catch (err) {
        const e = err as InputValidationError;
        const result = failure("add", e.code, e.message, start);
        if (json) { emit(result, true); return; }
        console.error(e.message);
        process.exitCode = 1;
        return;
      }

      const store = createStore(DATA_DIR);
      const resolver = createResolver();

      if (!resolver.supports(source)) {
        const result = failure("add", "UNKNOWN_FORMAT", `Unknown source format: ${source}`, start);
        emit(result, json);
        if (!json) console.error(result.error!.message);
        return;
      }

      try {
        const resolved = await resolver.resolve(source);
        const toolId = resolved.meta.name ?? source.replace(/[/@]/g, "-").replace(/^-/, "");

        // ── dry-run: show what would happen, don't install ──
        if (opts.dryRun) {
          const dryResult = {
            action: "install",
            source: resolved.source,
            toolId,
            installPath: getToolInstallDir(DATA_DIR, toolId),
            meta: resolved.meta,
            alreadyInstalled: await store.has(toolId),
          };
          if (json) {
            emit(success("add", dryResult, start), true);
          } else {
            console.log(`Would install: ${source}`);
            console.log(`  Source: ${resolved.source.format}:${resolved.source.uri}`);
            console.log(`  Tool ID: ${toolId}`);
            console.log(`  Path: ${dryResult.installPath}`);
            console.log(`  Already installed: ${dryResult.alreadyInstalled}`);
          }
          return;
        }

        if (!opts.force && await store.has(toolId)) {
          if (json) {
            emit(success("add", { toolId, alreadyInstalled: true, message: "Use --force to reinstall" }, start), true);
          } else {
            console.log(`Tool ${toolId} is already installed. Use --force to reinstall.`);
          }
          return;
        }

        if (!json) {
          console.log(`Resolving ${source}...`);
          console.log(`  → ${resolved.source.format}:${resolved.source.uri} (${toolId})`);
        }

        const tool = await installTool(source, DATA_DIR, {
          store,
          verbose: !json,
          recursive: opts.deep,
        });

        // Always auto-generate rich SKILL.md (use --no-skill to skip)
        let skillPath: string | undefined;
        if (opts.skill !== false) {
          const skillContent = generateRichSkillMd(tool);
          const skillDir = join(DATA_DIR, "tools", tool.id, "skill");
          const { mkdirSync } = await import("node:fs");
          mkdirSync(skillDir, { recursive: true });
          skillPath = join(skillDir, "SKILL.md");
          writeFileSync(skillPath, skillContent, "utf-8");
          if (!json) console.log(`  SKILL.md generated: ${skillPath}`);
        }

        if (json) {
          emit(success("add", { tool, skillPath }, start), true);
        } else {
          console.log(`\n✓ ${tool.meta.name}@${tool.meta.version} installed`);
          console.log(`  ${tool.capabilities.commands.length} commands, ${tool.capabilities.globalFlags.length} flags discovered`);
          if (tool.capabilities.rawHelp) console.log("  CONTEXT.md generated with help output");
        }
      } catch (err) {
        const msg = toErrorMessage(err);
        const result = failure("add", "INSTALL_FAILED", msg, start);
        emit(result, json);
        if (!json) { console.error(`Install failed: ${msg}`); process.exitCode = 1; }
      }
    });
}

/**
 * forge/mode-workflow.ts — NL prompt → agent code from templates.
 */

import { join, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { success, emit, toErrorMessage } from "../../lib/output.js";
import { rejectPathTraversal } from "../../lib/guards.js";
import { classifyIntent } from "../../lib/pipeline/intent.js";
import { extractEntities } from "../../lib/pipeline/entity-extractor.js";
import { parsePrompt } from "../../lib/pipeline/prompt-parser.js";
import { generateFromTemplate } from "../../lib/pipeline/templates/template-engine.js";
import { getAllTemplates } from "../../lib/pipeline/templates/index.js";
import { generateSkillFromWorkflow } from "../../lib/pipeline/workflow-gen.js";
import type { WorkflowIntent, GeneratedWorkflow } from "../../lib/types.js";
import type { CliArgs } from "./types.js";
import { log, atomicWrite } from "./helpers.js";

export function workflowMode(args: CliArgs, startTime: number): void {
  if (args.out) rejectPathTraversal(args.out, "--out path");
  const outDir = resolve(args.out || "examples/generated-workflows");

  // --list: show available templates
  if (args.list) {
    const templates = getAllTemplates();
    log("\n  Available workflow templates:\n");
    for (const t of templates) {
      log(`  ${t.name}`);
      log(`    Strategy: ${t.strategy}`);
      log(`    ${t.description}\n`);
    }
    if (args.json) {
      emit(success("skill-forge:workflow", {
        templates: templates.map(t => ({ name: t.name, strategy: t.strategy, description: t.description })),
      }, startTime), true);
    }
    return;
  }

  if (!args.prompt) {
    log('  Usage: npx tsx examples/skill-forge.ts --workflow "build a code review council"');
    log("         npx tsx examples/skill-forge.ts --workflow --list");
    return;
  }

  const intent = classifyIntent(args.prompt);
  const parsed = parsePrompt(args.prompt);
  const entities = extractEntities(args.prompt);

  const packages = entities
    .filter(e => e.packageName)
    .map(e => ({
      name: e.packageName!,
      repo: e.repoSlug ?? "",
      source: e.source,
      domain: e.domain,
      description: `${e.name} package`,
      quality_score: 0.8,
    }));

  log(`  Mode:         workflow`);
  log(`  Prompt:       ${args.prompt}`);
  log(`  Intent:       ${intent.intent} (${(intent.confidence * 100).toFixed(0)}%)`);
  log(`  Capabilities: ${parsed.capabilities.join(", ") || "none"}`);
  log(`  Entities:     ${entities.map(e => e.name).join(", ") || "none"}`);

  if (args.dryRun) {
    log(`\n  (dry-run — no files written)\n`);
    if (args.json) {
      emit(success("skill-forge:workflow", {
        prompt: args.prompt,
        intent: { type: intent.intent, confidence: intent.confidence },
        capabilities: parsed.capabilities,
        entities: entities.map(e => ({ name: e.name, type: e.type })),
      }, startTime), true);
    }
    return;
  }

  const result = generateFromTemplate(
    intent.intent as WorkflowIntent,
    packages,
    entities,
    { name: args.prompt.slice(0, 30) },
  );

  if (!result) {
    log(`\n  No matching workflow template for intent "${intent.intent}".`);
    log(`  Available: ${getAllTemplates().map(t => t.name).join(", ")}`);
    log(`  Try: "code review council", "content publishing", "e-commerce", "personal assistant"\n`);
    return;
  }

  log(`  Template:     ${result.template.name}`);
  log(`  Strategy:     ${result.template.strategy}`);

  const slugName = args.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const outPath = join(outDir, slugName);
  mkdirSync(outPath, { recursive: true });

  atomicWrite(join(outPath, "agent.ts"), result.code);

  if (result.envVars.length > 0) {
    atomicWrite(join(outPath, ".env.example"), result.envVars.map((v: string) => `${v}=`).join("\n") + "\n");
  }

  // Generate SKILL.md from workflow (Gap 11 — --skill-output flag)
  if (args.skillOutput) {
    try {
      const workflow: GeneratedWorkflow = {
        workflowName: slugName,
        intent: intent.intent as WorkflowIntent,
        packages,
        envVars: result.envVars,
        config: {
          name: slugName,
          intent: intent.intent as WorkflowIntent,
          packages,
          entities: [],
          outputPath: outPath,
        },
        files: { "agent.ts": result.code },
      };
      const skillContent = generateSkillFromWorkflow(workflow);
      atomicWrite(join(outPath, "SKILL.md"), skillContent);
      log(`  Skill:    ${outPath}/SKILL.md`);
    } catch (err) {
      log(`  WARN: skill generation from workflow failed: ${toErrorMessage(err)}`);
    }
  }

  log(`\n  Generated workflow:`);
  log(`  Output:   ${outPath}/`);
  log(`  Agent:    ${result.code.split("\n").length} lines`);
  if (result.envVars.length > 0) {
    log(`  Env vars: ${result.envVars.join(", ")}`);
  }

  const preview = result.code.split("\n").slice(0, 8).map((l: string) => `    ${l}`).join("\n");
  log(`\n  Preview:\n${preview}\n    ...\n`);

  if (args.json) {
    emit(success("skill-forge:workflow", {
      template: { name: result.template.name, strategy: result.template.strategy },
      output: outPath,
      lines: result.code.split("\n").length,
      envVars: result.envVars,
    }, startTime), true);
  }
}

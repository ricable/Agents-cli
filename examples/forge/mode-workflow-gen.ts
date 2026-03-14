/**
 * forge/mode-workflow-gen.ts — Generate publishable workflows from agent script directories.
 *
 * Pipeline: validate → discover scripts → analyzeAgentDirectory() →
 * inferWorkflowManifest() → generate SKILL.md + scripts → quality gate → write.
 */

import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { join, basename, resolve, extname } from "node:path";
import { rejectPathTraversal } from "../../lib/guards.js";
import { success, failure, emit } from "../../lib/output.js";
import { analyzeAgentDirectory } from "../../lib/pipeline/agent-analyzer.js";
import { inferWorkflowManifest } from "../../lib/pipeline/workflow-manifest-inference.js";
import { generateWorkflowSkillMd, generateRunScript, generateSetupScript, generateWorkflowReference } from "../../lib/pipeline/workflow-skill-gen.js";
import { testSkillSync } from "../../lib/skill-tester.js";
import { log } from "./helpers.js";
import type { CliArgs } from "./types.js";

export async function workflowGenMode(args: CliArgs, startTime: number): Promise<void> {
  const dirPath = args.workflowGen!;

  // Validate input directory
  rejectPathTraversal(dirPath, "workflow source directory");
  const resolvedDir = resolve(dirPath);
  if (!existsSync(resolvedDir)) {
    emit(failure("workflow-gen", "NOT_FOUND", `Directory not found: ${resolvedDir}`, startTime), args.json);
    process.exitCode = 1;
    return;
  }

  log(`  Analyzing agent scripts in: ${resolvedDir}`);

  // Discover and analyze scripts
  const analyses = analyzeAgentDirectory(resolvedDir);
  if (analyses.size === 0) {
    emit(failure("workflow-gen", "NO_SCRIPTS", "No agent scripts found (.py/.ts/.js/.sh)", startTime), args.json);
    process.exitCode = 1;
    return;
  }

  log(`  Found ${analyses.size} scripts:`);
  for (const [name, analysis] of analyses) {
    const deps = analysis.crossScriptDeps.length > 0 ? ` (deps: ${analysis.crossScriptDeps.join(", ")})` : "";
    const envs = analysis.envVars.length > 0 ? ` [env: ${analysis.envVars.join(", ")}]` : "";
    log(`    ${analysis.language === "python" ? "🐍" : analysis.language === "shell" ? "🐚" : "📜"} ${name}${deps}${envs}`);
  }

  // Infer workflow manifest
  const workflowName = basename(resolvedDir);

  const workflow = inferWorkflowManifest(analyses, {
    name: workflowName,
    domain: args.domain || undefined,
  });

  log(`\n  Inferred workflow: ${workflow.name}`);
  log(`  Steps: ${workflow.steps.map(s => s.name).join(" → ")}`);
  if (workflow.envVars?.length) {
    log(`  Env vars: ${workflow.envVars.map(v => `${v.name}${v.required ? " (required)" : ""}`).join(", ")}`);
  }
  if (workflow.dataFlow?.length) {
    log(`  Data flow: ${workflow.dataFlow.map(e => `${e.from} →[${e.artifact}]→ ${e.to}`).join(", ")}`);
  }
  if (workflow.estimatedDuration) {
    log(`  Estimated duration: ~${workflow.estimatedDuration}`);
  }

  // Generate skill directory contents
  const skillMd = generateWorkflowSkillMd(workflow);
  const runSh = generateRunScript(workflow);
  const setupSh = generateSetupScript(workflow);
  const workflowRef = generateWorkflowReference(workflow);

  // Quality gate
  const testResult = testSkillSync("inline", skillMd);
  log(`\n  Quality gate:`);
  log(`    Trigger: ${testResult.triggerScore.toFixed(2)} (need ≥ 0.80)`);
  log(`    Quality: ${testResult.qualityScore}/10 (need ≥ 6)`);
  log(`    Content: ${testResult.contentScore}/10 (need ≥ 5)`);
  log(`    Passed:  ${testResult.passed ? "✅" : "❌"}`);

  if (testResult.issues.length > 0) {
    for (const issue of testResult.issues) {
      log(`    ⚠ ${issue}`);
    }
  }

  // Determine output directory
  const outBase = args.out || "examples/generated-workflows";
  const outDir = join(outBase, workflowName);
  rejectPathTraversal(outDir, "workflow output directory");

  if (args.dryRun) {
    log(`\n  [DRY RUN] Would write to: ${outDir}`);
    log(`    SKILL.md (${skillMd.length} bytes)`);
    log(`    scripts/run.sh (${runSh.length} bytes)`);
    log(`    scripts/setup.sh (${setupSh.length} bytes)`);
    log(`    references/workflow.md (${workflowRef.length} bytes)`);
    log(`    agents/ (${analyses.size} scripts)`);

    if (args.json) {
      emit(success("workflow-gen", {
        name: workflowName,
        steps: workflow.steps.length,
        envVars: workflow.envVars?.length ?? 0,
        dataFlow: workflow.dataFlow?.length ?? 0,
        quality: testResult,
        dryRun: true,
      }, startTime), true);
    }
    return;
  }

  // Write output
  log(`\n  Writing workflow to: ${outDir}`);

  mkdirSync(join(outDir, "scripts"), { recursive: true });
  mkdirSync(join(outDir, "references"), { recursive: true });
  mkdirSync(join(outDir, "agents"), { recursive: true });

  writeFileSync(join(outDir, "SKILL.md"), skillMd);
  writeFileSync(join(outDir, "scripts", "run.sh"), runSh, { mode: 0o755 });
  writeFileSync(join(outDir, "scripts", "setup.sh"), setupSh, { mode: 0o755 });
  writeFileSync(join(outDir, "references", "workflow.md"), workflowRef);

  // Copy agent scripts
  let copied = 0;
  const validExts = new Set([".py", ".ts", ".js", ".sh", ".bash"]);
  try {
    const entries = readdirSync(resolvedDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = extname(entry.name).toLowerCase();
      if (!validExts.has(ext)) continue;
      copyFileSync(join(resolvedDir, entry.name), join(outDir, "agents", entry.name));
      copied++;
    }
  } catch (err) {
    log(`  ⚠ Failed to copy some agent scripts: ${err instanceof Error ? err.message : String(err)}`);
  }

  log(`  ✅ Generated: SKILL.md + scripts + references + ${copied} agent scripts`);

  if (args.json) {
    emit(success("workflow-gen", {
      name: workflowName,
      outputDir: outDir,
      steps: workflow.steps.length,
      envVars: workflow.envVars?.length ?? 0,
      dataFlow: workflow.dataFlow?.length ?? 0,
      estimatedDuration: workflow.estimatedDuration,
      quality: testResult,
      files: {
        "SKILL.md": skillMd.length,
        "scripts/run.sh": runSh.length,
        "scripts/setup.sh": setupSh.length,
        "references/workflow.md": workflowRef.length,
        agents: copied,
      },
    }, startTime), true);
  }
}

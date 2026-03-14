import { Command } from "commander";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { isJsonMode, getStore } from "./shared.js";

export function registerComposeCommand(program: Command): void {
  program
    .command("compose [prompt]")
    .description("Generate a workflow from natural language using agentic LLM composition")
    .option("--from-skills <ids>", "Comma-separated skill IDs to compose")
    .option("--iterations <n>", "Max refinement iterations (default: 5)", "5")
    .option("--sandbox", "Use Docker sandbox for validation")
    .option("--creative", "Enable creative cross-domain compositions")
    .option("--domain <name>", "Target domain for focused proposals")
    .option("--output <dir>", "Output directory (default: examples/generated-workflows/<name>)")
    .option("--json", "Output as structured JSON")
    .option("--dry-run", "Show what would be generated without writing files")
    .action(async (prompt: string | undefined, opts: {
      fromSkills?: string;
      iterations?: string;
      sandbox?: boolean;
      creative?: boolean;
      domain?: string;
      output?: string;
      json?: boolean;
      dryRun?: boolean;
    }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      if (!prompt && !opts.fromSkills) {
        const result = failure("compose", "MISSING_INPUT", "Provide a prompt or --from-skills", start);
        if (json) { emit(result, true); return; }
        console.error("Usage: agents-cli compose \"Python CI pipeline\" or agents-cli compose --from-skills src-ruff,src-pytest");
        process.exitCode = 1;
        return;
      }

      try {
        const store = await getStore();

        // Gather available skills
        const skillRecords = store.listSkills({ limit: 500 });
        const availableSkills = skillRecords.map((s) => ({
          id: s.id,
          name: s.name,
          domain: s.domain,
          description: s.description,
          commands: [],
          inputs: [],
          outputs: [],
        }));

        const knownSkillIds = new Set(skillRecords.map((s) => s.id));
        const seedSkills = opts.fromSkills?.split(",").map((s) => s.trim());
        const effectivePrompt = prompt ?? `Compose a workflow using: ${seedSkills?.join(", ")}`;

        if (opts.dryRun) {
          const result = success("compose", {
            dryRun: true,
            prompt: effectivePrompt,
            seedSkills,
            availableSkillCount: availableSkills.length,
            maxIterations: parseInt(opts.iterations ?? "5", 10),
            creativity: opts.creative ? 0.8 : 0.5,
            domain: opts.domain,
          }, start);
          if (json) { emit(result, true); return; }
          console.log("[dry-run] Would compose workflow:");
          console.log(`  Prompt: ${effectivePrompt}`);
          console.log(`  Available skills: ${availableSkills.length}`);
          console.log(`  Max iterations: ${opts.iterations}`);
          return;
        }

        const { composeWorkflow } = await import("../../lib/composer/iteration-loop.js");

        const composeResult = await composeWorkflow({
          prompt: effectivePrompt,
          seedSkills,
          availableSkills,
          knownSkillIds,
          maxIterations: parseInt(opts.iterations ?? "5", 10),
          minQuality: 0.8,
          creativity: opts.creative ? 0.8 : 0.5,
          domain: opts.domain,
          sandbox: opts.sandbox,
          onProgress: (iteration, report) => {
            if (!json) {
              console.log(`  Iteration ${iteration}: score=${report.score.toFixed(2)}, issues=${report.issues.length}`);
            }
          },
        });

        // Write output files
        const name = composeResult.workflow.metadata.name;
        const outputDir = opts.output ?? join("examples", "generated-workflows", name);
        mkdirSync(join(outputDir, "scripts"), { recursive: true });
        mkdirSync(join(outputDir, "references"), { recursive: true });

        writeFileSync(join(outputDir, "SKILL.md"), composeResult.skillMd, "utf-8");
        writeFileSync(join(outputDir, "workflow.yaml"), composeResult.workflowYaml, "utf-8");
        writeFileSync(join(outputDir, "scripts", "run.sh"), composeResult.runScript, { encoding: "utf-8", mode: 0o755 });
        writeFileSync(join(outputDir, "scripts", "setup.sh"), composeResult.setupScript, { encoding: "utf-8", mode: 0o755 });

        const result = success("compose", {
          name,
          outputDir,
          iterations: composeResult.iterations,
          quality: composeResult.finalQuality,
          converged: composeResult.converged,
          steps: composeResult.workflow.spec.steps.length,
          trace: composeResult.trace,
        }, start);

        if (json) { emit(result, true); return; }

        console.log(`\nWorkflow generated: ${name}`);
        console.log(`  Output: ${outputDir}`);
        console.log(`  Steps: ${composeResult.workflow.spec.steps.length}`);
        console.log(`  Quality: ${composeResult.finalQuality.toFixed(2)}`);
        console.log(`  Iterations: ${composeResult.iterations}`);
        console.log(`  Converged: ${composeResult.converged}`);
      } catch (err) {
        const result = failure("compose", "COMPOSE_ERROR", toErrorMessage(err), start);
        if (json) { emit(result, true); return; }
        console.error(`Compose failed: ${toErrorMessage(err)}`);
        process.exitCode = 1;
      }
    });
}

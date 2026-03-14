import { Command } from "commander";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { isJsonMode, getStore } from "./shared.js";
import type { SkillProfile } from "../../lib/composer/proposer.js";

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

        const seedSkills = opts.fromSkills?.split(",").map((s) => s.trim());
        const effectivePrompt = prompt ?? `Compose a workflow using: ${seedSkills?.join(", ")}`;

        // Use all 4 discovery methods to gather relevant skills
        const { discoverSkills } = await import("../../lib/intelligence/discovery.js");
        const { TieredLLMClient } = await import("../../lib/composer/llm-client.js");

        const llmClient = new TieredLLMClient();
        const allDiscovered = new Map<string, SkillProfile>();

        /** Convert a discovery result into a SkillProfile and add to map. */
        function collectSkills(skills: Array<{ id: string; name: string; domain: string; description: string }>): void {
          for (const s of skills) {
            if (!allDiscovered.has(s.id)) {
              allDiscovered.set(s.id, {
                id: s.id, name: s.name, domain: s.domain,
                description: s.description, commands: [], inputs: [], outputs: [],
              });
            }
          }
        }

        // Run independent discovery methods in parallel where possible
        const discoveryTasks: Array<Promise<void>> = [
          // Method 1: semantic — find skills matching the prompt
          discoverSkills(store, null, { method: "semantic", query: effectivePrompt, limit: 20 })
            .then((r) => collectSkills(r.skills)).catch(() => {}),
          // Method 3: multi-hop-llm — LLM decomposes the prompt into sub-needs
          discoverSkills(store, null, { method: "multi-hop-llm", query: effectivePrompt, llmClient, limit: 15 })
            .then((r) => collectSkills(r.skills)).catch(() => {}),
        ];

        // Method 2: domain-semantic — only if domain is specified
        if (opts.domain) {
          discoveryTasks.push(
            discoverSkills(store, null, { method: "domain-semantic", query: effectivePrompt, domain: opts.domain, limit: 20 })
              .then((r) => collectSkills(r.skills)).catch(() => {}),
          );
        }

        // Method 4: graph-traversal — only if seed skills are provided
        if (seedSkills && seedSkills.length > 0) {
          discoveryTasks.push(
            discoverSkills(store, null, { method: "graph-traversal", query: effectivePrompt, seedSkills, limit: 15, maxDepth: 3 })
              .then((r) => collectSkills(r.skills)).catch(() => {}),
          );
        }

        await Promise.allSettled(discoveryTasks);

        // Fallback: if discovery found nothing, fall back to listSkills
        if (allDiscovered.size === 0) {
          collectSkills(store.listSkills({ limit: 50, domain: opts.domain }));
        }

        const availableSkills = [...allDiscovered.values()];
        const knownSkillIds = new Set(allDiscovered.keys());

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

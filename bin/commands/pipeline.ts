import { Command } from "commander";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { isJsonMode } from "./shared.js";

export function registerPipelineCommand(program: Command): void {
  program
    .command("pipeline <prompt>")
    .description("Analyze prompt and discover packages from npm/GitHub/crates")
    .option("--dry-run", "Analyze prompt without searching registries")
    .option("--json", "Output as structured JSON")
    .action(async (prompt: string, opts: { dryRun?: boolean; json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const { classifyIntent } = await import("../../lib/pipeline/intent.js");
        const { parsePrompt } = await import("../../lib/pipeline/prompt-parser.js");
        const { extractEntities } = await import("../../lib/pipeline/entity-extractor.js");

        const intent = classifyIntent(prompt);
        const parsed = parsePrompt(prompt);
        const entities = extractEntities(prompt);

        if (opts.dryRun) {
          const data = { prompt, intent, parsed, entities };
          if (json) { emit(success("pipeline", data, start), true); }
          else {
            console.log("Pipeline analysis (dry-run):");
            console.log(`  Prompt: ${prompt}`);
            console.log(`  Intent: ${intent.intent} (confidence: ${intent.confidence})`);
            if (parsed.capabilities.length > 0) console.log(`  Capabilities: ${parsed.capabilities.join(", ")}`);
            console.log(`  Entities: ${entities.map(e => e.name).join(", ") || "none"}`);
          }
          return;
        }

        // Non-dry-run: actually discover packages from registries
        const { discoverNpmPackages } = await import("../../lib/classifier/npm.js");
        const { discoverGitHubRepos } = await import("../../lib/classifier/github.js");
        const { CAPABILITY_SEARCH_MAP } = await import("../../lib/pipeline/capability-map.js");

        // Collect search terms from parsed capabilities
        const searchTerms = new Set<string>();
        for (const cap of parsed.capabilities) {
          const mapping = CAPABILITY_SEARCH_MAP[cap];
          if (mapping) {
            for (const term of mapping.npm) searchTerms.add(term);
          }
        }
        // Also use entity names as search terms
        for (const e of entities) {
          searchTerms.add(e.name.toLowerCase());
        }

        // Discover from npm and GitHub in parallel
        const [npmResults, githubResults] = await Promise.allSettled([
          discoverNpmPackages(),
          discoverGitHubRepos(),
        ]);

        const npmPkgs = npmResults.status === "fulfilled" ? npmResults.value : [];
        const githubPkgs = githubResults.status === "fulfilled" ? githubResults.value : [];

        // Filter to relevant packages using search terms
        const allPkgs = [...npmPkgs, ...githubPkgs];
        const relevant = searchTerms.size > 0
          ? allPkgs.filter(p =>
              [...searchTerms].some(t =>
                p.name.includes(t) || p.description.toLowerCase().includes(t)
              )
            )
          : allPkgs;

        // Deduplicate by repo
        const seen = new Set<string>();
        const packages = relevant.filter(p => {
          if (seen.has(p.repo)) return false;
          seen.add(p.repo);
          return true;
        }).slice(0, 25);

        const data = { prompt, intent, parsed, entities, packages };

        if (json) {
          emit(success("pipeline", data, start), true);
        } else {
          console.log(`\nPipeline analysis:`);
          console.log(`  Intent: ${intent.intent} (confidence: ${intent.confidence})`);
          if (parsed.capabilities.length > 0) console.log(`  Capabilities: ${parsed.capabilities.join(", ")}`);
          if (entities.length > 0) {
            console.log(`  Entities:`);
            for (const e of entities) {
              console.log(`    - ${e.name} (${e.type})`);
            }
          }
          if (packages.length > 0) {
            console.log(`\n  Discovered packages (${packages.length}):`);
            for (const p of packages) {
              console.log(`    ${p.name} — ${p.description.slice(0, 80)}`);
            }
          } else {
            console.log(`\n  No packages discovered.`);
          }
          console.log();
        }
      } catch (err) {
        const msg = toErrorMessage(err);
        if (json) { emit(failure("pipeline", "PIPELINE_FAILED", msg, start), true); }
        else { console.error(`Pipeline failed: ${msg}`); process.exitCode = 1; }
      }
    });
}

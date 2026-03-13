/**
 * forge/mode-orchestrate.ts — Orchestration mode dispatcher.
 *
 * Handles:
 *   --orchestrate --recipe <name>   Execute a multi-app recipe
 *   --orchestrate --recipe <path>   Execute a recipe from JSON file
 *   --orchestrate --list            List available recipes
 */

import type { CliArgs } from "./types.js";
import { log } from "./helpers.js";
import { success, failure, emit } from "../../lib/output.js";
import { toErrorMessage } from "../../lib/output.js";
import { getRecipe, listRecipes, loadRecipeFromFile } from "../../lib/orchestration/recipes.js";
import { executeRecipe } from "../../lib/orchestration/runner.js";
import { formatExecutionProgress, getExecutionSummary } from "../../lib/orchestration/monitor.js";
import type { Recipe } from "../../lib/orchestration/types.js";

/**
 * Run orchestration mode.
 */
export async function orchestrateMode(args: CliArgs, startTime: number): Promise<void> {
  // List recipes
  if (args.list) {
    const recipes = listRecipes();
    log("  Available Recipes:");
    log("");
    for (const r of recipes) {
      log(`    ${r.id.padEnd(20)} ${r.name}`);
      log(`    ${"".padEnd(20)} ${r.description}`);
      log(`    ${"".padEnd(20)} Apps: ${r.apps.join(", ")}`);
      log(`    ${"".padEnd(20)} Concurrency: ${r.concurrency}`);
      if (r.marketplace) {
        log(`    ${"".padEnd(20)} Price: $${r.marketplace.price} ${r.marketplace.currency}`);
      }
      log("");
    }
    if (args.json) {
      emit(success("orchestrate:list", { recipes }, startTime), true);
    }
    return;
  }

  // Resolve recipe
  const recipeName = args.recipe;
  if (!recipeName) {
    emit(
      failure("orchestrate", "MISSING_RECIPE", "Specify a recipe: --recipe <name|path>", startTime),
      args.json,
    );
    return;
  }

  let recipe: Recipe | undefined;

  // Try built-in first, then file
  recipe = getRecipe(recipeName);
  if (!recipe) {
    // Try as file path
    if (recipeName.endsWith(".json")) {
      try {
        recipe = loadRecipeFromFile(recipeName);
      } catch (err) {
        emit(
          failure("orchestrate", "INVALID_RECIPE", toErrorMessage(err), startTime),
          args.json,
        );
        return;
      }
    } else {
      const available = listRecipes().map((r) => r.id).join(", ");
      emit(
        failure(
          "orchestrate",
          "UNKNOWN_RECIPE",
          `Recipe "${recipeName}" not found. Available: ${available}`,
          startTime,
        ),
        args.json,
      );
      return;
    }
  }

  log(`  Mode: Orchestrate`);
  log(`  Recipe: ${recipe.name} (${recipe.id})`);
  log(`  Apps: ${recipe.apps.join(", ")}`);
  log(`  Concurrency: ${Math.min(args.concurrency, recipe.concurrency)}`);
  if (args.dryRun) log("  (dry-run)");
  if (args.resume) log(`  Resuming: ${args.resume}`);
  log("");

  try {
    const execution = await executeRecipe({
      recipe,
      outputDir: args.outputDir || "examples/generated-skills",
      dryRun: args.dryRun,
      concurrency: args.concurrency,
      resume: args.resume || undefined,
      tier: "starter",
      onProgress: (app, phase, status) => {
        log(`    [${status.padEnd(5)}] ${app} phase ${phase}`);
      },
    });

    log("");
    log(formatExecutionProgress(execution));

    if (args.json) {
      const summary = getExecutionSummary(execution);
      emit(success("orchestrate", summary, startTime), true);
    }
  } catch (err) {
    emit(
      failure("orchestrate", "EXECUTION_ERROR", toErrorMessage(err), startTime),
      args.json,
    );
  }
}

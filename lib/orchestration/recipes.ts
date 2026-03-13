/**
 * orchestration/recipes.ts — Built-in recipes and JSON loader.
 *
 * A recipe defines a batch of applications to process together
 * with shared quality thresholds and concurrency settings.
 */

import { readFileSync } from "node:fs";
import { toErrorMessage } from "../output.js";
import type { Recipe } from "./types.js";

// ── Built-in Recipes ───────────────────────────────────────────────────

export const BUILT_IN_RECIPES: Recipe[] = [
  {
    id: "creative-suite",
    name: "Creative Suite",
    description:
      "CLI harnesses for creative applications: GIMP, Blender, Inkscape, Audacity, Kdenlive, Shotcut",
    version: "1.0.0",
    apps: ["gimp", "blender", "inkscape", "audacity", "kdenlive", "shotcut"],
    teamSize: 7,
    quality: { minOverall: 80, minPerAxis: 70 },
    phases: [1, 2, 3, 4, 5, 6, 7],
    thresholds: {
      trigger: 80,
      quality: 80,
      content: 80,
      testCoverage: 70,
      apiCompleteness: 70,
      reliability: 80,
    },
    concurrency: 3,
    marketplace: { price: 9.99, currency: "USD" },
  },
  {
    id: "office-suite",
    name: "Office Suite",
    description:
      "CLI harnesses for office and communication tools: LibreOffice Writer, LibreOffice Calc, LibreOffice Impress, Draw.io, Zoom, Slack",
    version: "1.0.0",
    apps: ["libreoffice-writer", "libreoffice-calc", "libreoffice-impress", "drawio", "zoom", "slack"],
    teamSize: 7,
    quality: { minOverall: 80, minPerAxis: 70 },
    phases: [1, 2, 3, 4, 5, 6, 7],
    thresholds: {
      trigger: 80,
      quality: 80,
      content: 80,
      testCoverage: 70,
      apiCompleteness: 70,
      reliability: 80,
    },
    concurrency: 3,
    marketplace: { price: 9.99, currency: "USD" },
  },
  {
    id: "devops-kit",
    name: "DevOps Kit",
    description:
      "CLI harnesses for media and document processing: FFmpeg, Pandoc, ImageMagick, Graphviz, Tesseract, ExifTool",
    version: "1.0.0",
    apps: ["ffmpeg", "pandoc", "imagemagick", "graphviz", "tesseract", "exiftool"],
    teamSize: 7,
    quality: { minOverall: 80, minPerAxis: 70 },
    phases: [1, 2, 3, 4, 5, 6, 7],
    thresholds: {
      trigger: 80,
      quality: 80,
      content: 80,
      testCoverage: 70,
      apiCompleteness: 70,
      reliability: 80,
    },
    concurrency: 3,
    marketplace: { price: 14.99, currency: "USD" },
  },
];

// ── Accessors ──────────────────────────────────────────────────────────

/**
 * Look up a built-in recipe by ID.
 */
export function getRecipe(id: string): Recipe | undefined {
  return BUILT_IN_RECIPES.find((r) => r.id === id);
}

/**
 * List all built-in recipes.
 */
export function listRecipes(): Recipe[] {
  return [...BUILT_IN_RECIPES];
}

/**
 * Load a recipe from a JSON file with basic validation.
 */
export function loadRecipeFromFile(path: string): Recipe {
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (err) {
    throw new Error(`Failed to read recipe file "${path}": ${toErrorMessage(err)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in recipe file "${path}": ${toErrorMessage(err)}`);
  }

  const recipe = parsed as Record<string, unknown>;

  // Validate required fields
  const required = ["id", "name", "description", "version", "apps", "teamSize", "quality", "phases", "thresholds", "concurrency"];
  for (const field of required) {
    if (!(field in recipe)) {
      throw new Error(`Recipe file "${path}" missing required field: ${field}`);
    }
  }

  if (!Array.isArray(recipe.apps) || recipe.apps.length === 0) {
    throw new Error(`Recipe file "${path}" must have a non-empty apps array`);
  }

  if (typeof recipe.concurrency !== "number" || recipe.concurrency < 1) {
    throw new Error(`Recipe file "${path}" concurrency must be a positive integer`);
  }

  return recipe as unknown as Recipe;
}

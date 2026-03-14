/**
 * CLI-Anything adapter: wraps the cli-anything pipeline for non-CLI apps.
 *
 * Handles sources with "cli-anything:" prefix (e.g., "cli-anything:blender").
 * Analyzes the app, generates a CLI harness, and returns a SkillCandidate.
 */

import type { SourceAdapter, SkillCandidate, AdapterOptions } from "./types.js";
import { extractAdapterName, errorCandidate, buildCandidateTool } from "./types.js";

export class CliAnythingAdapter implements SourceAdapter {
  readonly type = "cli-anything" as const;

  supports(source: string): boolean {
    return source.startsWith("cli-anything:");
  }

  async analyze(source: string, opts?: AdapterOptions): Promise<SkillCandidate> {
    const appName = extractAdapterName(source, "cli-anything:");
    if (!appName) {
      return { source, adapter: this.type, meta: { name: source, description: "Empty app name" } };
    }

    try {
      const { runCliAnythingPipeline } = await import("../cli-anything/pipeline.js");

      const result = await runCliAnythingPipeline({
        appName,
        dryRun: false,
        outputDir: opts?.skillsDir,
        deep: opts?.deep,
      });

      const tool = buildCandidateTool({
        id: `cli-anything-${appName}`,
        name: appName,
        description: result.profile?.description ?? `CLI harness for ${appName}`,
        tags: ["cli-anything", ...(result.profile?.tags ?? [])],
        format: "cli-anything",
        uri: source,
        commands: result.harness?.commands ?? [],
        installPath: opts?.skillsDir ?? "",
      });

      return { source, adapter: this.type, tool, pruneAfter: false };
    } catch (err) {
      return errorCandidate(source, this.type, appName, err);
    }
  }
}

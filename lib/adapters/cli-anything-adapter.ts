/**
 * CLI-Anything adapter: wraps the cli-anything pipeline for non-CLI apps.
 *
 * Handles sources with "cli-anything:" prefix (e.g., "cli-anything:blender").
 * Analyzes the app, generates a CLI harness, and returns a SkillCandidate.
 */

import type { SourceAdapter, SkillCandidate, AdapterOptions } from "./types.js";
import { toErrorMessage } from "../output.js";

export class CliAnythingAdapter implements SourceAdapter {
  readonly type = "cli-anything" as const;

  supports(source: string): boolean {
    return source.startsWith("cli-anything:");
  }

  async analyze(source: string, opts?: AdapterOptions): Promise<SkillCandidate> {
    const appName = source.replace(/^cli-anything:/, "").trim();
    if (!appName) {
      return {
        source,
        adapter: "cli-anything",
        meta: { name: source, description: "Empty app name" },
      };
    }

    try {
      const { runCliAnythingPipeline } = await import("../cli-anything/pipeline.js");

      const result = await runCliAnythingPipeline({
        appName,
        dryRun: false,
        outputDir: opts?.skillsDir,
        deep: opts?.deep,
      });

      // Build a partial Tool from the pipeline result
      const tool = {
        id: `cli-anything-${appName}`,
        meta: {
          name: appName,
          version: "1.0.0",
          description: result.profile?.description ?? `CLI harness for ${appName}`,
          tags: ["cli-anything", ...(result.profile?.tags ?? [])],
        },
        source: { format: "cli-anything" as const, uri: source },
        capabilities: {
          commands: result.harness?.commands ?? [],
          globalFlags: [],
          subcommandAliases: {},
        },
        installPath: opts?.skillsDir ?? "",
        status: "installed" as const,
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        source,
        adapter: "cli-anything",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tool: tool as any,
        pruneAfter: false,
      };
    } catch (err) {
      return {
        source,
        adapter: "cli-anything",
        meta: { name: appName, description: toErrorMessage(err) },
      };
    }
  }
}

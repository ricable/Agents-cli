/**
 * Registry adapter: wraps existing resolve-install-analyze pipeline.
 *
 * Handles: GitHub (owner/repo), npm (@scope/pkg, npm:pkg),
 * PyPI (pypi:pkg), crates.io (crates:pkg), local (./path).
 */

import type { SourceAdapter, SkillCandidate, AdapterOptions } from "./types.js";
import { validateSource } from "../guards.js";
import { toErrorMessage } from "../output.js";

export class RegistryAdapter implements SourceAdapter {
  readonly type = "registry" as const;

  supports(source: string): boolean {
    try {
      validateSource(source);
      return true;
    } catch {
      return false;
    }
  }

  async analyze(source: string, opts?: AdapterOptions): Promise<SkillCandidate> {
    validateSource(source);

    try {
      const { createResolver } = await import("../resolver.js");
      const { createStore } = await import("../store.js");
      const { installTool } = await import("../skills.js");

      const dataDir = opts?.dataDir ?? (await import("os")).homedir() + "/.agents-cli";
      const resolver = createResolver();
      const store = createStore(dataDir);

      // Resolve
      const resolved = await resolver.resolve(source);

      // Check if already installed
      const toolId = resolved.meta.name ?? source.replace(/[:/]/g, "-");
      const existing = await store.get(toolId);
      if (existing && !opts?.force) {
        return {
          source,
          adapter: "registry",
          tool: existing,
          pruneAfter: true,
        };
      }

      // Install
      const tool = await installTool(source, dataDir, {
        verbose: false,
        recursive: opts?.deep,
      });

      return {
        source,
        adapter: "registry",
        tool,
        pruneAfter: true,
      };
    } catch (err) {
      return {
        source,
        adapter: "registry",
        meta: { name: source.replace(/[:/]/g, "-"), description: toErrorMessage(err) },
      };
    }
  }
}

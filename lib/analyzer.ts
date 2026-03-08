import type { ToolAnalyzer, ToolCapabilities, AnalyzeOptions } from "./types.js";

/** Create an analyzer instance */
export function createAnalyzer(): ToolAnalyzer {
  return {
    async analyze(
      binPath: string,
      _options?: AnalyzeOptions,
    ): Promise<ToolCapabilities> {
      void binPath;

      // Phase 2: --help probe + flag parsing
      // Phase 3: LLM-based analysis fallback
      return {
        commands: [],
        globalFlags: [],
        analysisMethod: "help-probe",
      };
    },
  };
}

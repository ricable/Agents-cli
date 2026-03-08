import type { ToolAnalyzer, ToolCapabilities, ToolCommand, ToolFlag, AnalyzeOptions } from "./types.js";
import { execFileSync } from "node:child_process";
import { readdirSync, statSync, readFileSync, existsSync, realpathSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";

/** Validate that a resolved path stays within the given base directory */
function assertWithinDir(resolved: string, baseDir: string): void {
  const real = existsSync(resolved) ? realpathSync(resolved) : resolvePath(resolved);
  const realBase = realpathSync(baseDir);
  if (!real.startsWith(realBase + "/") && real !== realBase) {
    throw new Error(`Path traversal blocked: ${resolved} escapes ${baseDir}`);
  }
}

/** Try running a binary with --help or -h and capture output */
function probeHelp(binPath: string, timeout: number): string | null {
  for (const flag of ["--help", "-h", "help"]) {
    try {
      const output = execFileSync(binPath, [flag], {
        timeout,
        stdio: ["pipe", "pipe", "pipe"],
        encoding: "utf-8",
      });
      if (output && output.length > 20) {
        return output;
      }
    } catch (e: unknown) {
      // Some tools print help to stderr or exit non-zero
      const err = e as { stdout?: string; stderr?: string };
      const combined = `${err.stdout ?? ""}${err.stderr ?? ""}`;
      if (combined.length > 20) {
        return combined;
      }
    }
  }
  return null;
}

/** Parse flags from a line like "  -o, --output <file>   Output file path" */
function parseFlag(line: string): ToolFlag | null {
  const m = /^\s+(-\w)(?:,\s+)?(--[\w-]+)?(?:\s+[<\[]\w+[>\]])?(?:\s{2,}(.+))?/.exec(line)
    ?? /^\s+(--[\w-]+)(?:\s+[<\[]\w+[>\]])?(?:\s{2,}(.+))?/.exec(line);
  if (!m) return null;

  // First regex: m[1]=short, m[2]=long, m[3]=desc. Second regex: m[1]=long, m[2]=desc
  const isFirstRegex = m[3] !== undefined || (m[1] !== undefined && !m[1].startsWith("--"));
  const alias = isFirstRegex ? m[1] : undefined;
  const name = isFirstRegex ? (m[2] ?? m[1] ?? "") : (m[1] ?? "");
  const description = (isFirstRegex ? (m[3] ?? "") : (m[2] ?? "")).trim();

  if (!name) return null;

  const hasValue = /[<\[]\w+[>\]]/.test(line);
  return {
    name,
    alias: alias ?? undefined,
    description,
    type: hasValue ? "string" : "boolean",
    required: /\brequired\b/i.test(description),
  };
}

/** Parse subcommands from help output */
function parseCommands(helpText: string): ToolCommand[] {
  const commands: ToolCommand[] = [];
  const lines = helpText.split("\n");
  let inCommandSection = false;

  for (const line of lines) {
    if (/^(commands|available commands|subcommands)/i.test(line.trim()) || /^\s*(Commands|COMMANDS):?\s*$/.test(line)) {
      inCommandSection = true;
      continue;
    }
    if (inCommandSection) {
      if (line.trim() === "" || /^[A-Z]/.test(line.trim())) {
        if (line.trim() !== "" && !/command/i.test(line)) {
          inCommandSection = false;
          continue;
        }
        if (line.trim() === "") continue;
      }
      const cmdMatch = /^\s{2,}(\w[\w-]*)\s{2,}(.+)/.exec(line);
      if (cmdMatch?.[1] && cmdMatch[2]) {
        commands.push({
          name: cmdMatch[1],
          description: cmdMatch[2].trim(),
          flags: [],
        });
      }
    }
  }
  return commands;
}

/** Parse global flags from help output */
function parseFlags(helpText: string): ToolFlag[] {
  const flags: ToolFlag[] = [];
  const lines = helpText.split("\n");
  let inFlagSection = false;

  for (const line of lines) {
    if (/^(options|flags|global options)/i.test(line.trim()) || /^\s*(Options|FLAGS|GLOBAL OPTIONS):?\s*$/.test(line)) {
      inFlagSection = true;
      continue;
    }
    if (inFlagSection) {
      if (line.trim() === "") {
        inFlagSection = false;
        continue;
      }
      const flag = parseFlag(line);
      if (flag) flags.push(flag);
    }
  }
  return flags;
}

/** Try to find the main binary in a tool directory */
export function findMainBinary(toolDir: string): string | null {
  // Check package.json bin field
  const pkgPath = join(toolDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<string, unknown>;
      const bin = pkg.bin;
      if (typeof bin === "string") {
        const resolved = join(toolDir, bin);
        try { assertWithinDir(resolved, toolDir); } catch { return null; }
        if (existsSync(resolved)) return resolved;
      } else if (typeof bin === "object" && bin !== null) {
        const entries = Object.values(bin as Record<string, string>);
        if (entries[0]) {
          const resolved = join(toolDir, entries[0]);
          try { assertWithinDir(resolved, toolDir); } catch { return null; }
          if (existsSync(resolved)) return resolved;
        }
      }
      // Check main field as fallback
      const main = pkg.main;
      if (typeof main === "string") {
        const resolved = join(toolDir, main);
        try { assertWithinDir(resolved, toolDir); } catch { return null; }
        if (existsSync(resolved)) return resolved;
      }
    } catch { /* ignore parse errors */ }
  }

  // Check bin/ directory
  const binDir = join(toolDir, "bin");
  if (existsSync(binDir)) {
    const entries = readdirSync(binDir);
    for (const entry of entries) {
      const full = join(binDir, entry);
      try {
        const st = statSync(full);
        if (st.isFile() && (st.mode & 0o111)) return full;
      } catch { /* skip */ }
    }
  }

  // Check for common patterns
  for (const name of ["cli.js", "index.js", "main.py", "cli.py", "__main__.py"]) {
    const candidate = join(toolDir, name);
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

/** Create an analyzer instance */
export function createAnalyzer(): ToolAnalyzer {
  return {
    async analyze(
      binPath: string,
      options?: AnalyzeOptions,
    ): Promise<ToolCapabilities> {
      const timeout = options?.timeout ?? 10000;

      // Try --help probe
      const helpText = probeHelp(binPath, timeout);

      if (helpText) {
        const commands = parseCommands(helpText);
        const globalFlags = parseFlags(helpText);

        return {
          commands,
          globalFlags,
          analysisMethod: commands.length > 0 || globalFlags.length > 0 ? "flag-parse" : "help-probe",
          rawHelp: helpText,
        };
      }

      // No help output available
      return {
        commands: [],
        globalFlags: [],
        analysisMethod: "help-probe",
      };
    },
  };
}

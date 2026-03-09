import type { ToolAnalyzer, ToolCapabilities, ToolCommand, ToolFlag, ToolSubcommand, AnalyzeOptions, InteractionMode } from "./types.js";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync, realpathSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";
import { readPkgJson, walkPackageDirs } from "./pkg-utils.js";

/** Max subcommands before we stop recursing (prevents runaway on tools like gcloud) */
const MAX_TOTAL_COMMANDS = 500;

/** Validate that a resolved path stays within the given base directory */
function assertWithinDir(resolved: string, baseDir: string): void {
  const real = existsSync(resolved) ? realpathSync(resolved) : resolvePath(resolved);
  const realBase = realpathSync(baseDir);
  if (!real.startsWith(realBase + "/") && real !== realBase) {
    throw new Error(`Path traversal blocked: ${resolved} escapes ${baseDir}`);
  }
}

/** Try running a binary with args and capture output */
function probeWithArgs(binPath: string, args: string[], timeout: number): string | null {
  for (const flag of ["--help", "-h", "help"]) {
    try {
      const output = execFileSync(binPath, [...args, flag], {
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

/** Try running a binary with --help or -h and capture output */
function probeHelp(binPath: string, timeout: number): string | null {
  return probeWithArgs(binPath, [], timeout);
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

/** Flags that leak from agents-cli's own analyzer into probed tool output */
const ANALYZER_GHOST_FLAGS = new Set(["--json", "--root-dir", "--output-format", "--data-dir"]);

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
      if (flag && !ANALYZER_GHOST_FLAGS.has(flag.name)) flags.push(flag);
    }
  }
  return flags;
}

/** Extract example commands from help text (lines starting with $ or indented commands) */
function parseExamples(helpText: string): string[] {
  const examples: string[] = [];
  const lines = helpText.split("\n");
  let inExampleSection = false;

  for (const line of lines) {
    if (/^(examples?|usage examples?)/i.test(line.trim()) || /^\s*(EXAMPLES?|Usage):?\s*$/i.test(line)) {
      inExampleSection = true;
      continue;
    }
    if (inExampleSection) {
      // Lines starting with $ are command examples
      const dollarMatch = /^\s*\$\s+(.+)/.exec(line);
      if (dollarMatch?.[1]) {
        examples.push(dollarMatch[1].trim());
        continue;
      }
      // Indented lines that look like commands (start with the tool name or common patterns)
      const cmdLine = /^\s{2,}(\w[\w-]*\s+.+)/.exec(line);
      if (cmdLine?.[1] && !cmdLine[1].startsWith("--") && !cmdLine[1].startsWith("-")) {
        examples.push(cmdLine[1].trim());
        continue;
      }
      // Empty line after examples ends the section
      if (line.trim() === "" && examples.length > 0) {
        inExampleSection = false;
      }
    }
  }
  return examples;
}

/**
 * Recursively probe a binary's subcommands.
 * This is the heart of deep command discovery — like gws reading Discovery Service,
 * but we read --help at each level of the command tree.
 */
function probeSubcommands(
  binPath: string,
  parentArgs: string[],
  maxDepth: number,
  currentDepth: number,
  timeout: number,
  totalCount: { value: number },
): ToolSubcommand[] {
  if (currentDepth >= maxDepth || totalCount.value >= MAX_TOTAL_COMMANDS) {
    return [];
  }

  const helpText = probeWithArgs(binPath, parentArgs, timeout);
  if (!helpText) return [];

  const rawCommands = parseCommands(helpText);
  const results: ToolSubcommand[] = [];

  for (const cmd of rawCommands) {
    if (totalCount.value >= MAX_TOTAL_COMMANDS) break;
    totalCount.value++;

    // Probe this subcommand's own help to get its flags, examples, and children
    const subArgs = [...parentArgs, cmd.name];
    const subHelp = probeWithArgs(binPath, subArgs, Math.min(timeout, 3000));
    const subFlags = subHelp ? parseFlags(subHelp) : [];
    const subExamples = subHelp ? parseExamples(subHelp) : [];

    // Recurse into children
    const children = probeSubcommands(
      binPath,
      subArgs,
      maxDepth,
      currentDepth + 1,
      timeout,
      totalCount,
    );

    results.push({
      name: cmd.name,
      description: cmd.description,
      flags: subFlags.length > 0 ? subFlags : cmd.flags,
      subcommands: children,
      examples: subExamples,
      rawHelp: subHelp ?? undefined,
    });
  }

  return results;
}

/** Flatten a subcommand tree into a flat ToolCommand[] for backward compatibility */
function flattenSubcommands(subs: readonly ToolSubcommand[], prefix: string = ""): ToolCommand[] {
  const result: ToolCommand[] = [];
  for (const sub of subs) {
    const fullName = prefix ? `${prefix} ${sub.name}` : sub.name;
    result.push({
      name: fullName,
      description: sub.description,
      flags: [...sub.flags],
    });
    result.push(...flattenSubcommands(sub.subcommands, fullName));
  }
  return result;
}

/** Count total commands in a subcommand tree */
function countSubcommands(subs: readonly ToolSubcommand[]): number {
  let count = subs.length;
  for (const sub of subs) {
    count += countSubcommands(sub.subcommands);
  }
  return count;
}

// ── Binary resolution (unchanged) ────────────────────────────────────────────

/** Resolve the first bin/main entry from a parsed PkgInfo, validated against toolDir */
function resolveBinFromPkg(dir: string, bin: Record<string, string> | string | undefined, main: string | undefined, toolDir: string): string | null {
  if (typeof bin === "string") {
    const resolved = join(dir, bin);
    try { assertWithinDir(resolved, toolDir); } catch { return null; }
    if (existsSync(resolved)) return resolved;
  } else if (typeof bin === "object" && bin !== null) {
    const first = Object.values(bin)[0];
    if (first) {
      const resolved = join(dir, first);
      try { assertWithinDir(resolved, toolDir); } catch { return null; }
      if (existsSync(resolved)) return resolved;
    }
  }
  if (typeof main === "string") {
    const resolved = join(dir, main);
    try { assertWithinDir(resolved, toolDir); } catch { return null; }
    if (existsSync(resolved)) return resolved;
  }
  return null;
}

/** Patterns for standard venv scripts/dependency binaries to exclude from binary discovery */
const VENV_EXCLUDE = /^(python[0-9.]*|pip[0-9.]*|activate.*|easy_install[0-9.]*|wheel|setuptools|f2py[0-9.]*|cython(ize)?[0-9.]*|nosetests|py\.test|chardetect|normalizer|markdown_py|pygmentize|2to3[0-9.]*|idle[0-9.]*|jsonschema|httpx|uvicorn|gunicorn|flask|celery|sphinx-[a-z]+|pydoc[0-9.]*|isort|dmypy|mypy(c)?|stubgen|stubtest|pyflakes|pycodestyle|pep8|flake8|autopep8|yapf|black(d)?|coverage|pytest|py\.test|tox|nox|virtualenv|ipython[0-9.]*|jupyter[a-z-]*|pybabel|mako-render|alembic|dulwich|rst2[a-z]+\.py|docutils|tabulate|distro|dotenv|identify|cfgv|pre-commit|nodeenv)$/;

/**
 * Try to find the main binary in a tool directory.
 *
 * @param toolDir - The tool's installation directory
 * @param preferName - Optional tool name to prefer when scanning .venv/bin/.
 *   When provided, the function first checks for an executable matching this
 *   name (and common variants like hyphenated forms) before falling back to
 *   the first non-excluded executable alphabetically. This prevents picking
 *   dependency binaries (e.g. `f2py` instead of `gradio`).
 */
export function findMainBinary(toolDir: string, preferName?: string): string | null {
  // Check .venv/bin/ for PyPI-installed tools
  const venvBinDir = join(toolDir, ".venv", "bin");
  if (existsSync(venvBinDir)) {
    try {
      // Preference pass: check for binary matching the tool name first
      if (preferName) {
        const lower = preferName.toLowerCase();
        const candidates = new Set([
          preferName,                           // exact: "gradio"
          lower,                                // lowercase: "CrewAI" → "crewai"
          preferName.replace(/[._]/g, "-"),     // normalize: "label_studio" → "label-studio"
          preferName.replace(/-/g, "_"),         // reverse: "label-studio" → "label_studio"
          lower.replace(/^python-/, ""),         // strip python- prefix
          lower.replace(/^py-/, ""),             // strip py- prefix
          lower.replace(/-cli$/, ""),            // strip -cli suffix
          lower.replace(/_/g, "-"),              // underscores→hyphens
          lower.replace(/-/g, "_"),              // hyphens→underscores
        ]);
        for (const name of candidates) {
          const full = join(venvBinDir, name);
          try {
            const st = statSync(full);
            if (st.isFile() && (st.mode & 0o111)) return full;
          } catch { /* not found, try next */ }
        }
      }

      // Fallback: first non-excluded executable (original behavior)
      for (const entry of readdirSync(venvBinDir)) {
        if (VENV_EXCLUDE.test(entry)) continue;
        const full = join(venvBinDir, entry);
        try {
          const st = statSync(full);
          if (st.isFile() && (st.mode & 0o111)) return full;
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  // Check root package.json bin/main fields
  const rootPkg = readPkgJson(toolDir);
  if (rootPkg) {
    const found = resolveBinFromPkg(toolDir, rootPkg.bin, rootPkg.main, toolDir);
    if (found) return found;
  }

  // Check bin/ directory
  const binDir = join(toolDir, "bin");
  if (existsSync(binDir)) {
    try {
      for (const entry of readdirSync(binDir)) {
        const full = join(binDir, entry);
        try {
          const st = statSync(full);
          if (st.isFile() && (st.mode & 0o111)) return full;
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  // Check for common patterns
  for (const name of ["cli.js", "index.js", "main.py", "cli.py", "__main__.py"]) {
    const candidate = join(toolDir, name);
    if (existsSync(candidate)) return candidate;
  }

  // Search nested packages (monorepo support)
  let nestedBin: string | null = null;
  walkPackageDirs(toolDir, (pkg): boolean => {
    if (!pkg.bin) return false;
    const found = resolveBinFromPkg(pkg.dir, pkg.bin, pkg.main, toolDir);
    if (found) {
      nestedBin = found;
      return true; // stop walking
    }
    return false;
  });

  return nestedBin;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Deeply probe a tool's command tree. Exported for `schema` command and rich skill generation. */
export function deepProbe(
  binPath: string,
  options: { maxDepth?: number; timeout?: number } = {},
): { tree: ToolSubcommand[]; totalCommands: number } {
  const maxDepth = options.maxDepth ?? 3;
  const timeout = options.timeout ?? 10000;
  const totalCount = { value: 0 };

  const tree = probeSubcommands(binPath, [], maxDepth, 0, timeout, totalCount);

  return { tree, totalCommands: totalCount.value };
}

/** Create an analyzer instance */
export function createAnalyzer(): ToolAnalyzer {
  return {
    async analyze(
      binPath: string,
      options?: AnalyzeOptions,
    ): Promise<ToolCapabilities> {
      const timeout = options?.timeout ?? 10000;
      const recursive = options?.recursive ?? false;
      const maxDepth = options?.maxDepth ?? 3;

      // Try --help probe
      const helpText = probeHelp(binPath, timeout);

      if (helpText) {
        const globalFlags = parseFlags(helpText);

        if (recursive) {
          // Deep probe: recursively discover subcommands with their own flags/examples
          const { tree } = deepProbe(binPath, { maxDepth, timeout });
          // Flatten for backward-compatible commands array
          const flatCommands = flattenSubcommands(tree);
          const interactionMode = detectInteractionMode(flatCommands, globalFlags, helpText);

          return {
            commands: flatCommands,
            globalFlags,
            analysisMethod: flatCommands.length > 0 || globalFlags.length > 0 ? "flag-parse" : "help-probe",
            rawHelp: helpText,
            interactionMode,
          };
        }

        // Shallow probe: parse top-level commands only (original behavior)
        const commands = parseCommands(helpText);

        // NEW: also parse per-command flags by probing each command's --help
        const enrichedCommands: ToolCommand[] = [];
        for (const cmd of commands) {
          const cmdHelp = probeWithArgs(binPath, [cmd.name], Math.min(timeout, 3000));
          const cmdFlags = cmdHelp ? parseFlags(cmdHelp) : [];
          enrichedCommands.push({
            name: cmd.name,
            description: cmd.description,
            flags: cmdFlags.length > 0 ? cmdFlags : cmd.flags,
          });
        }

        const interactionMode = detectInteractionMode(enrichedCommands, globalFlags, helpText);

        return {
          commands: enrichedCommands,
          globalFlags,
          analysisMethod: enrichedCommands.length > 0 || globalFlags.length > 0 ? "flag-parse" : "help-probe",
          rawHelp: helpText,
          interactionMode,
        };
      }

      // No help output available
      return {
        commands: [],
        globalFlags: [],
        analysisMethod: "help-probe",
        interactionMode: "single",
      };
    },
  };
}

// ── Interaction mode detection ────────────────────────────────────────────────

/** REPL-indicating subcommand names */
const REPL_COMMANDS = new Set(["shell", "repl", "interactive", "console", "chat"]);

/** REPL-indicating long flags */
const REPL_FLAGS = /^--(interactive|repl|shell|console)$/;

/** Detect whether a tool operates as repl, subcommand, or single-shot */
export function detectInteractionMode(
  commands: readonly ToolCommand[],
  globalFlags: readonly ToolFlag[],
  rawHelp?: string,
): InteractionMode {
  // Check for REPL-indicating subcommands
  for (const cmd of commands) {
    if (REPL_COMMANDS.has(cmd.name.toLowerCase())) return "repl";
  }
  // Check for REPL-indicating flags (long form only — short -i is too
  // ambiguous since grep -i, sed -i, curl -i etc. all use it)
  for (const flag of globalFlags) {
    if (REPL_FLAGS.test(flag.name)) return "repl";
  }
  // Check raw help text for REPL indicators
  if (rawHelp) {
    const lower = rawHelp.toLowerCase();
    if (/\brepl\b/.test(lower) || /\binteractive\s+(mode|shell|session)\b/.test(lower)) {
      return "repl";
    }
  }
  // Subcommand mode if commands were found
  if (commands.length > 0) return "subcommand";
  // Otherwise single-shot
  return "single";
}

/** Check if a binary responds to a single flag (no help-flag appending).
 *  Returns true if the binary produces meaningful output (>20 chars). */
export function probeFlag(binPath: string, flag: string, timeout: number): boolean {
  try {
    const out = execFileSync(binPath, [flag], {
      timeout, maxBuffer: 1_048_576, stdio: ["pipe", "pipe", "pipe"], encoding: "utf-8",
    });
    return out.length > 20;
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null) {
      const err = e as { stdout?: string; stderr?: string };
      return `${err.stdout ?? ""}${err.stderr ?? ""}`.length > 20;
    }
    return false;
  }
}

export { parseExamples, parseFlags, parseCommands, countSubcommands, flattenSubcommands, probeHelp, probeWithArgs };

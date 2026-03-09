/**
 * Repository content extraction utilities.
 *
 * Extracts README prose/code, TypeScript export groups, and package metadata
 * from cloned repos. Houses analyzeRepo() so skill-factory stays lean.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { ManifestEntry, PackageAnalysis, ExportGroup } from "./types.js";

/** Regex that matches common package manager install commands */
export const INSTALL_CMD_RE = /^\$?\s*(pip|npm|brew|cargo|go|apt|yum|dnf|scoop|choco|winget|port|snap|flatpak|pacman|emerge|nix-env|conda|zypper|apk|pkg|sudo\s+\w+)\s+(install|add|get|--install|-S)\b/;

// ── README helpers ───────────────────────────────────────────────────────

export function readReadme(repoDir: string): string {
  for (const name of ["README.md", "readme.md", "Readme.md"]) {
    try {
      return readFileSync(join(repoDir, name), "utf-8");
    } catch {
      /* not found or unreadable — try next */
    }
  }
  return "";
}

/**
 * Returns the first meaningful prose paragraph from a README,
 * skipping titles, badges, images, and HTML.
 */
export function extractReadmeExcerpt(readme: string, maxChars = 400): string {
  const prose: string[] = [];
  for (const line of readme.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("#")) continue;
    if (t.startsWith("!")) continue; // images
    if (t.startsWith("[!")) continue; // badges
    if (t.startsWith("<")) continue; // HTML
    if (t.startsWith("|")) continue; // tables
    if (t.startsWith("```")) continue; // code fences
    if (/^\[.*\]\(.*\)$/.test(t)) continue; // bare links
    prose.push(t);
    if (prose.join(" ").length >= maxChars) break;
  }
  return prose.join(" ").slice(0, maxChars);
}

/** Extracted README sections keyed by normalized heading */
export interface ReadmeSections {
  /** All code blocks (any language) from the README, capped at 10 */
  codeBlocks: Array<{ lang: string; code: string }>;
  /** Sections by heading (lowercase, e.g. "quick start", "installation", "usage") */
  sections: Record<string, string>;
  /** Full README text (capped) */
  raw: string;
}

/** Check if a fenced code block contains actual code (not prose or install-only commands) */
export function isActualCode(code: string, lang: string): boolean {
  // Known code languages are code — but still filter trivial single-install blocks
  const codeLangs = new Set(["bash", "sh", "shell", "zsh", "python", "py", "javascript", "js",
    "typescript", "ts", "rust", "go", "ruby", "rb", "java", "c", "cpp", "yaml", "yml",
    "json", "toml", "ini", "sql", "dockerfile", "makefile", "cmake", "lua", "perl",
    "swift", "kotlin", "scala", "r", "powershell", "ps1", "fish", "elixir", "haskell"]);
  // Filter out trivial single-line install commands (e.g. `$ brew install foo`)
  const nonEmptyLines = code.split("\n").filter(l => l.trim().length > 0 && !l.trim().startsWith("#"));
  if (nonEmptyLines.length <= 2) {
    const allInstall = nonEmptyLines.every(l =>
      INSTALL_CMD_RE.test(l.trim()));
    if (allInstall) return false;
  }
  if (lang && codeLangs.has(lang.toLowerCase())) return true;
  // Known non-code languages
  if (["text", "txt", "output", "console", "log", "plaintext"].includes(lang.toLowerCase())) return false;

  const lines = code.split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return false;
  // Heuristic: code lines typically start with special chars, commands, or keywords
  const codeIndicators = /^[\s]*[$#>%]|^import |^from |^export |^const |^let |^var |^func |^fn |^def |^class |^use |^pub |^package |^module |[=(){}|;[\]<>]|^\w+\s+install\b|^\w+\s+--/;
  const codeLineCount = lines.filter(l => codeIndicators.test(l)).length;
  // If less than 30% of lines look like code, it's probably prose
  return codeLineCount / lines.length >= 0.3;
}

/** Strip badges, HTML comments, and noise from a markdown section */
export function cleanMarkdownSection(text: string): string {
  return text
    .split("\n")
    .filter(line => {
      const t = line.trim();
      // Remove badge images: ![text](url)
      if (/^!\[.*\]\(.*\)$/.test(t)) return false;
      // Remove shields.io / repology badges
      if (t.includes("shields.io") || t.includes("repology.org") || t.includes("badge")) return false;
      // Remove HTML comments
      if (/^<!--.*-->$/.test(t)) return false;
      // Remove pure HTML block tags
      if (/^<\/?(?:div|p|br|hr|a|details|summary|table|tr|td|th|img)\b[^>]*\/?>$/.test(t)) return false;
      // Remove HTML with only id/class attributes (anchors)
      if (/^<[a-z]+\s+(?:id|class)="[^"]*"\s*\/?>$/i.test(t)) return false;
      return true;
    })
    .join("\n")
    // Strip inline HTML comments spanning multiple lines
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract CLI commands for a specific tool from README code blocks.
 * Only returns commands where the first token matches the tool name.
 */
export function extractCommandsFromReadme(
  readme: string,
  toolName: string,
): Array<{ name: string; description: string }> {
  const commands: Array<{ name: string; description: string }> = [];
  const seen = new Set<string>();
  const lines = readme.split("\n");

  let insideCodeBlock = false;
  let prevComment = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      insideCodeBlock = !insideCodeBlock;
      if (!insideCodeBlock) prevComment = "";
      continue;
    }
    if (!insideCodeBlock) {
      prevComment = "";
      continue;
    }
    // Track comment lines as potential descriptions
    if (trimmed.startsWith("#") && !trimmed.startsWith("#!")) {
      prevComment = trimmed.replace(/^#+\s*/, "").trim();
      continue;
    }
    // Match command lines: $ tool subcommand or tool subcommand
    const cmdMatch = trimmed.match(new RegExp(`^\\$?\\s*${escapeRegex(toolName)}\\s+(\\S+)`));
    if (cmdMatch) {
      const subcmd = cmdMatch[1]!;
      // Skip flags, file paths, special chars, and very short tokens
      if (subcmd.startsWith("-") || subcmd.includes("/") || subcmd.includes(".")) continue;
      if (subcmd.length < 2 || /^[^a-zA-Z]/.test(subcmd)) continue;
      if (/^[…>|&]/.test(subcmd)) continue;
      // Skip common shell redirection artifacts
      if (["2>/dev/null", ">", ">>", "|", "&&", "||"].includes(subcmd)) continue;
      if (!seen.has(subcmd)) {
        seen.add(subcmd);
        commands.push({ name: subcmd, description: prevComment || subcmd });
      }
      prevComment = "";
    }
  }
  return commands.slice(0, 10);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Binary name + version inference ──────────────────────────────────────

/**
 * Extract a TOML section by header name. Returns the text between
 * [name] and the next [header] (or EOF), excluding nested arrays.
 */
function extractTomlSection(toml: string, section: string): string | null {
  const re = new RegExp(`^\\[${section}\\]\\s*\\n`, "m");
  const match = re.exec(toml);
  if (!match) return null;
  const start = match.index + match[0].length;
  // Find next top-level section header (not [[array]])
  const rest = toml.slice(start);
  const nextSection = rest.search(/^\[(?!\[)/m);
  return nextSection === -1 ? rest : rest.slice(0, nextSection);
}

/** Extract [[bin]] names and package name from a Cargo.toml string. */
function extractCargoBinNames(cargo: string, names: Set<string>): void {
  const binRe = /\[\[bin\]\]\s*\n((?:(?!\[).*\n)*)/g;
  let m: RegExpExecArray | null;
  while ((m = binRe.exec(cargo)) !== null) {
    const nameMatch = m[1]!.match(/name\s*=\s*"([^"]+)"/);
    if (nameMatch) names.add(nameMatch[1]!);
  }
  // Single-binary crate: package name is the binary
  const pkgSection = extractTomlSection(cargo, "package");
  if (pkgSection && names.size === 0) {
    const pkgName = pkgSection.match(/^name\s*=\s*"([^"]+)"/m);
    if (pkgName) names.add(pkgName[1]!);
  }
}

/**
 * Infer binary names from a cloned repo's build files.
 * Checks Cargo.toml [[bin]] entries, Go cmd/ dirs, Makefile targets.
 * Returns unique names (excluding the repo name itself if different).
 */
export function inferBinaryNames(repoDir: string): string[] {
  const names = new Set<string>();

  // Rust: parse Cargo.toml for [[bin]] name entries and package name
  try {
    const cargo = readFileSync(join(repoDir, "Cargo.toml"), "utf-8");
    extractCargoBinNames(cargo, names);
    // For workspaces, also check member crates
    const wsSection = extractTomlSection(cargo, "workspace");
    if (wsSection && names.size === 0) {
      // Parse members = ["crates/*", ...] and scan each
      const membersMatch = wsSection.match(/members\s*=\s*\[([\s\S]*?)\]/);
      if (membersMatch) {
        const patterns = membersMatch[1]!.match(/"([^"]+)"/g) ?? [];
        for (const p of patterns) {
          const pattern = p.replace(/"/g, "");
          if (pattern.includes("*")) {
            // Glob pattern like "crates/*" — expand
            const base = pattern.replace("/*", "");
            const baseDir = join(repoDir, base);
            try {
              for (const sub of readdirSync(baseDir)) {
                const memberCargo = join(baseDir, sub, "Cargo.toml");
                try {
                  const mc = readFileSync(memberCargo, "utf-8");
                  extractCargoBinNames(mc, names);
                } catch { /* skip */ }
              }
            } catch { /* skip */ }
          } else {
            const memberCargo = join(repoDir, pattern, "Cargo.toml");
            try {
              const mc = readFileSync(memberCargo, "utf-8");
              extractCargoBinNames(mc, names);
            } catch { /* skip */ }
          }
        }
      }
    }
  } catch { /* no Cargo.toml */ }

  // Go: check cmd/*/main.go directories, or main.go at root + go.mod module name
  try {
    const cmdDir = join(repoDir, "cmd");
    if (existsSync(cmdDir)) {
      for (const entry of readdirSync(cmdDir)) {
        const mainGo = join(cmdDir, entry, "main.go");
        if (existsSync(mainGo)) names.add(entry);
      }
    }
    // Single-binary Go project: main.go at root, infer name from go.mod module
    if (names.size === 0 && existsSync(join(repoDir, "main.go"))) {
      try {
        const gomod = readFileSync(join(repoDir, "go.mod"), "utf-8");
        const modMatch = gomod.match(/^module\s+\S+\/([^/\s]+)/m);
        if (modMatch) names.add(modMatch[1]!);
      } catch { /* no go.mod */ }
    }
  } catch { /* no cmd/ */ }

  return [...names];
}

/**
 * Read version from Cargo.toml, setup.cfg, pyproject.toml, or CMakeLists.txt.
 * Used as fallback when GitHub API rate-limited and no package.json exists.
 */
export function readSourceVersion(repoDir: string): string | undefined {
  // Rust: Cargo.toml
  try {
    const cargo = readFileSync(join(repoDir, "Cargo.toml"), "utf-8");
    const pkgSection = extractTomlSection(cargo, "package");
    if (pkgSection) {
      const ver = pkgSection.match(/^version\s*=\s*"([^"]+)"/m);
      if (ver) return ver[1];
    }
  } catch { /* no Cargo.toml */ }

  // Python: pyproject.toml
  try {
    const pyproj = readFileSync(join(repoDir, "pyproject.toml"), "utf-8");
    const ver = pyproj.match(/version\s*=\s*"([^"]+)"/);
    if (ver) return ver[1];
  } catch { /* no pyproject.toml */ }

  // Python: setup.cfg
  try {
    const cfg = readFileSync(join(repoDir, "setup.cfg"), "utf-8");
    const ver = cfg.match(/version\s*=\s*(\S+)/);
    if (ver) return ver[1];
  } catch { /* no setup.cfg */ }

  // C/C++: CMakeLists.txt
  try {
    const cmake = readFileSync(join(repoDir, "CMakeLists.txt"), "utf-8");
    const ver = cmake.match(/project\s*\([^)]*VERSION\s+([0-9.]+)/i);
    if (ver) return ver[1];
  } catch { /* no CMakeLists.txt */ }

  return undefined;
}

/**
 * Extract structured sections from a README.
 * Returns code blocks and heading-keyed sections for enriching skill content.
 */
export function extractReadmeSections(readme: string, maxSectionChars = 2000): ReadmeSections {
  const result: ReadmeSections = { codeBlocks: [], sections: {}, raw: readme.slice(0, 10000) };
  if (!readme) return result;

  // Extract all fenced code blocks (any language), filtering out prose
  const codeRe = /```(\w*)\n([\s\S]*?)```/g;
  let cm: RegExpExecArray | null;
  while ((cm = codeRe.exec(readme)) !== null && result.codeBlocks.length < 10) {
    const code = cm[2]!.trim();
    const lang = cm[1] || "bash";
    if (code.length >= 10 && isActualCode(code, lang)) {
      result.codeBlocks.push({ lang, code: code.slice(0, 1500) });
    }
  }

  // Extract sections by heading (respecting code blocks)
  const lines = readme.split("\n");
  let currentHeading = "";
  let currentContent: string[] = [];
  let insideCodeBlock = false;

  for (const line of lines) {
    // Track code block boundaries
    if (line.trimStart().startsWith("```")) {
      insideCodeBlock = !insideCodeBlock;
      currentContent.push(line);
      continue;
    }

    // Only split on headings outside code blocks
    const headingMatch = !insideCodeBlock && line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      // Save previous section
      if (currentHeading && currentContent.length > 0) {
        const text = cleanMarkdownSection(currentContent.join("\n")).slice(0, maxSectionChars);
        if (text.length > 10) {
          result.sections[currentHeading] = text;
        }
      }
      currentHeading = headingMatch[1]!.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  // Save last section
  if (currentHeading && currentContent.length > 0) {
    const text = cleanMarkdownSection(currentContent.join("\n")).slice(0, maxSectionChars);
    if (text.length > 10) {
      result.sections[currentHeading] = text;
    }
  }

  return result;
}

/**
 * Extracts fenced TypeScript/JavaScript code blocks from markdown.
 * Returns up to maxBlocks blocks, each capped at maxChars characters.
 */
export function extractCodeBlocks(
  markdown: string,
  maxBlocks = 5,
  maxChars = 900,
): string[] {
  const blocks: string[] = [];
  const re = /```(?:typescript|ts|javascript|js)\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null && blocks.length < maxBlocks) {
    const code = m[1]!.trim();
    if (code.length >= 20) blocks.push(code.slice(0, maxChars));
  }
  return blocks;
}

// ── TypeScript export extraction ─────────────────────────────────────────

/**
 * Parses a TypeScript source file and returns export groups.
 *
 * Handles two forms:
 *   export { Foo, type Bar, baz } from "./some/module.js"   -> re-exports
 *   export function/class/type/interface/const Foo           -> direct exports
 */
export function extractExportGroups(filePath: string): ExportGroup[] {
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const groups: ExportGroup[] = [];

  // Re-export blocks: export { ... } from "module"
  const reRe = /export\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = reRe.exec(content)) !== null) {
    const symbols = m[1]!
      .split(",")
      .map((s) => s.trim().replace(/^type\s+/, "").trim())
      .filter(Boolean);
    if (symbols.length === 0) continue;
    const modName = m[2]!.split("/").pop()?.replace(/\.(js|ts|mjs)$/, "") ?? m[2]!;
    const existing = groups.find((g) => g.module === modName);
    if (existing) existing.symbols.push(...symbols);
    else groups.push({ module: modName, symbols });
  }

  // Direct exports: export function/class/type/interface/const/enum Name
  const directRe = /^export\s+(?:async\s+)?(?:function|class|type|interface|const|enum)\s+(\w+)/gm;
  const direct: string[] = [];
  while ((m = directRe.exec(content)) !== null) {
    direct.push(m[1]!);
  }
  if (direct.length > 0) groups.unshift({ module: "(direct)", symbols: direct });

  return groups;
}

// ── Entry-point discovery ─────────────────────────────────────────────────

/**
 * Finds TypeScript entry-point files to extract API surface from.
 * Checks src/index.ts, lib/index.ts, and auto-discovers packages sub-dirs.
 */
export function findEntryPoints(repoDir: string, pkgName: string): string[] {
  const candidates: string[] = [
    "src/index.ts",
    "lib/index.ts",
    "index.ts",
    `packages/${pkgName}/src/index.ts`,
    `packages/${pkgName}/src/types.ts`,
  ];

  // Also auto-discover all packages/*/src/index.ts
  const pkgDir = join(repoDir, "packages");
  if (existsSync(pkgDir)) {
    try {
      for (const sub of readdirSync(pkgDir)) {
        const candidate = `packages/${sub}/src/index.ts`;
        if (!candidates.includes(candidate)) candidates.push(candidate);
      }
    } catch {
      /* skip */
    }
  }

  return candidates
    .map((c) => join(repoDir, c))
    .filter((p) => existsSync(p))
    .slice(0, 6);
}

// ── Full repo analysis ────────────────────────────────────────────────────

export function analyzeRepo(entry: ManifestEntry, rPath: string): PackageAnalysis {
  // When a subdir is specified (monorepo package/crate), analyse from that root
  const analysisRoot = entry.subdir ? join(rPath, entry.subdir) : rPath;

  let pkgName = entry.name;
  let version = "latest";
  let description = entry.description;
  let exports: string[] = [];
  let keywords: string[] = [];
  let hasTypes = false;

  for (const pkgPath of [
    join(analysisRoot, "package.json"),
    join(rPath, "package.json"),
    join(rPath, "packages", entry.name, "package.json"),
  ]) {
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        pkgName = pkg.name ?? pkgName;
        version = pkg.version ?? version;
        description = pkg.description || description;
        exports = Object.keys(pkg.exports ?? {}).slice(0, 10);
        keywords = (pkg.keywords ?? []).slice(0, 10);
        hasTypes = !!(pkg.types || pkg.typings || pkg.exports?.types);
      } catch {
        /* unreadable */
      }
      break;
    }
  }

  // Source file walk — prefer analysisRoot (subdir), fall back to repo root
  const mainFiles: string[] = [];
  for (const srcDir of ["src", "lib", "packages"]) {
    const dirPath = join(analysisRoot, srcDir);
    if (!existsSync(dirPath)) continue;
    try {
      const walk = (dir: string, depth = 0): string[] => {
        if (depth > 3) return [];
        return readdirSync(dir).flatMap((f) => {
          const full = join(dir, f);
          const rel = relative(rPath, full);
          if (statSync(full).isDirectory()) {
            const skip = [
              "node_modules",
              ".git",
              "dist",
              "build",
              "__tests__",
              "test",
              "tests",
              "spec",
              "fixtures",
            ];
            return skip.includes(f) ? [] : walk(full, depth + 1);
          }
          return /\.(ts|js|mjs|cjs|rs|go)$/.test(f) && !/\.test\.|\.spec\./.test(f) ? [rel] : [];
        });
      };
      mainFiles.push(...walk(dirPath));
      if (mainFiles.length > 20) break;
    } catch {
      /* unreadable */
    }
  }

  // README extraction — prefer subdir README, fall back to repo root
  const readme = readReadme(analysisRoot) || readReadme(rPath);
  const readmeExcerpt = extractReadmeExcerpt(readme);
  const codeExamples = extractCodeBlocks(readme);

  // Export groups from entry points
  const entryPoints = findEntryPoints(analysisRoot, pkgName);
  const exportGroups = entryPoints.flatMap((ep) => extractExportGroups(ep));

  // Deduplicate groups by module name
  const seen = new Map<string, ExportGroup>();
  for (const g of exportGroups) {
    const existing = seen.get(g.module);
    if (existing) existing.symbols.push(...g.symbols);
    else seen.set(g.module, { ...g });
  }

  return {
    pkgName,
    version,
    description,
    mainFiles: mainFiles.slice(0, 20),
    exports,
    keywords,
    hasTypes,
    repoUrl: `https://github.com/${entry.repo}`,
    readmeExcerpt,
    codeExamples,
    exportGroups: [...seen.values()],
  };
}

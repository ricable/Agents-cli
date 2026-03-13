import type { Tool, SkillDirectory } from "../types.js";
import { shellQuote, validateToolName } from "../guards.js";
import { INSTALL_CMD_RE } from "../extractor.js";
export { shellQuote } from "../guards.js";
import {
  esc,
  normalizeDesc,
  buildDescription,
  inferDomain,
  isLikelyCli,
  inferBinName,
  detectToolLanguage,
  isHeavyWorkflow,
  inferAllowedTools,
  inferArgumentHint,
  inferInstallCommand,
  inferLibraryInstallCommand,
  generateLibraryQuickStart,
  generateExamplesStub,
  concreteArgs,
  MAX_QUICK_START_EXAMPLES,
  MAX_PATTERN_EXAMPLES,
  MAX_HELP_LINES,
} from "./description.js";
import { parseFrontmatter, discoverResources, RESOURCE_DIRS } from "./frontmatter.js";

// Suppress unused import warnings
void parseFrontmatter;
void discoverResources;
void RESOURCE_DIRS;
void MAX_HELP_LINES;
void MAX_PATTERN_EXAMPLES;

/** Internal metadata about what references are needed, shared between generators */
interface RefDecisions {
  readonly hasRefCommands: boolean;
  readonly hasRefHelp: boolean;
  readonly hasRefFlags: boolean;
  readonly hasRefGuide: boolean;
  readonly helpLines: readonly string[];
}

function computeRefDecisions(tool: Tool): RefDecisions {
  const commands = tool.capabilities.commands;
  const rawHelp = tool.capabilities.rawHelp ?? "";
  const helpLines = rawHelp.trim() ? rawHelp.trim().split("\n") : [];
  return {
    hasRefCommands: commands.length > 0,
    hasRefHelp: helpLines.length > MAX_HELP_LINES,
    hasRefFlags: commands.some(c => c.flags.length > 3),
    hasRefGuide: true,
    helpLines,
  };
}

export function generateRichSkillMd(tool: Tool): string {
  const commands = tool.capabilities.commands;
  const flags = tool.capabilities.globalFlags;
  const rawHelp = tool.capabilities.rawHelp ?? "";
  const desc = normalizeDesc(tool);
  const name = tool.meta.name;
  const description = buildDescription(tool);
  const hasCapabilities = commands.length > 0 || flags.length > 0;
  const domain = hasCapabilities ? null : inferDomain(tool);
  const helpLines = rawHelp.trim() ? rawHelp.trim().split("\n") : [];

  // README sections (attached by forge pipeline)
  const readmeSections = tool._readmeSections;

  // Check for curated metadata
  const curated = tool._curatedMeta;
  const isCli = isLikelyCli(tool);
  const isLibrary = !isCli && commands.length === 0;

  // Use curated description for header when resolver returned a generic one
  const headerDesc = (curated && (desc.length < 30 || desc.toLowerCase() === name.toLowerCase()))
    ? curated.description
    : desc;

  // Normalize name to strict kebab-case
  const kebabName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/claude|anthropic/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "unnamed-tool";

  // Infer compatibility from source format
  const compatMap: Record<string, string> = {
    npm: "Node.js v18+",
    pypi: "Python 3.10+",
    crates: "Rust toolchain",
    github: "See project README",
    local: "Local installation",
  };
  const compatibility = compatMap[tool.source.format] ?? "See project README";
  // Ensure license is a short SPDX identifier, not full license text
  const rawLicense = tool.meta.license ?? "MIT";
  const license = rawLicense.length > 64 || rawLicense.includes("\n") ? "MIT" : rawLicense;

  const s: string[] = [];

  // ── Frontmatter ──
  s.push("---");
  s.push(`name: ${kebabName}`);
  s.push(`version: ${tool.meta.version}`);
  s.push(`description: "${esc(description)}"`);
  s.push(`license: ${license}`);
  s.push(`compatibility: "${compatibility}"`);
  const domainValue = curated ? curated.category : inferDomain(tool).category;
  s.push(`domain: "${domainValue}"`);
  s.push(`ingredients:`);
  // Quote URIs that contain YAML-special chars (@, :, etc.)
  const uri = tool.source.uri;
  s.push(uri.includes("@") || uri.includes(":") ? `  - "${uri}"` : `  - ${uri}`);
  s.push(`tags:`);
  const tags = new Set<string>([...(tool.meta.tags as string[])]);
  // Tag based on whether this is a CLI tool or a library/SDK
  if (hasCapabilities || isCli) tags.add("cli-tool");
  if (isLibrary) tags.add("library");
  if (curated) {
    // Add category-derived tags
    for (const part of curated.category.split("/")) {
      if (part.length > 2) tags.add(part);
    }
  }
  // Add top command names as tags for discoverability (tools with 5+ commands)
  if (commands.length >= 5) {
    for (const cmd of commands.slice(0, 10)) {
      const cmdTag = cmd.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (cmdTag.length >= 2 && cmdTag.length <= 20) tags.add(cmdTag);
    }
  }
  for (const tag of tags) s.push(`  - ${tag}`);
  // Determine binary name early (needed by frontmatter + Quick Start)
  const binName = inferBinName(tool);
  // Rich frontmatter: allowed-tools based on domain
  const allowedTools = inferAllowedTools(tool, domainValue);
  if (allowedTools) s.push(`allowed-tools: "${allowedTools}"`);
  // Rich frontmatter: context:fork for heavy workflows
  if (isHeavyWorkflow(tool)) s.push("context: fork");
  // Rich frontmatter: argument-hint for parameterized tools
  const argHint = inferArgumentHint(tool, binName);
  if (argHint) s.push(`argument-hint: "${argHint}"`);
  s.push("---");
  s.push("");

  // ── Header ──
  s.push(`# ${name}`);
  s.push("");
  s.push(headerDesc + ".");
  if (curated && curated.agentValue) {
    s.push("");
    s.push(`**Agent value**: ${curated.agentValue}`);
  }
  if (tool.meta.homepage) {
    s.push(`Docs: ${tool.meta.homepage}`);
  }
  if (tool.source.format === "github") {
    s.push(`Source: https://github.com/${tool.source.uri}`);
  }
  s.push("");

  // ── Quick Start ──
  s.push("## Quick Start");
  s.push("");

  // Find README quick start section if available
  const readmeQuickStart = readmeSections?.sections["quick start"]
    ?? readmeSections?.sections["quickstart"]
    ?? readmeSections?.sections["getting started"];
  const readmeUsage = readmeSections?.sections["usage"]
    ?? readmeSections?.sections["basic usage"];

  // Show binary name if different from tool name
  if (binName !== name) {
    s.push(`The binary name for ${name} is \`${binName}\`.`);
    s.push("");
  }

  // Note interaction mode for agents
  const interactionMode = tool.capabilities.interactionMode;
  if (interactionMode === "repl") {
    s.push(`> **Mode**: This tool supports an interactive REPL/shell mode. Run \`${binName} --help\` to find the interactive subcommand or flag.`);
    s.push("");
  }

  /** Check if a text section is mostly install instructions (not usage) */
  const isMostlyInstall = (text: string): boolean => {
    const lines = text.split("\n").filter(l => l.trim().length > 0);
    if (lines.length === 0) return true;
    const installLines = lines.filter(l => INSTALL_CMD_RE.test(l.trim()) || /\b(install|homebrew|brew|cargo install|pip install|npm install|apt|download|binary|release)\b/i.test(l));
    return installLines.length / lines.length > 0.4;
  };

  if (commands.length > 0) {
    // Real CLI commands discovered — use them (prefer binary name)
    s.push("```bash");
    for (const cmd of commands.slice(0, MAX_QUICK_START_EXAMPLES)) {
      s.push(`# ${cmd.description || cmd.name}`);
      s.push(concreteArgs(cmd, binName));
      s.push("");
    }
    s.push("```");
  } else if (isLibrary || (!isCli && commands.length === 0)) {
    // Library/SDK or unknown tool with no commands — generate language-appropriate API examples
    // NEVER fall through to domain quickStart templates which contain fabricated CLI commands
    generateLibraryQuickStart(s, tool, name, uri, curated ?? undefined, readmeSections);
  } else if (domain && domain.quickStart.length > 0 && isCli && commands.length === 0) {
    // Domain-specific Quick Start — ONLY for confirmed CLI tools with no discovered commands
    // (tools with discovered commands already handled above)
    s.push("```bash");
    for (const line of domain.quickStart) s.push(line);
    if (domain.quickStart[domain.quickStart.length - 1] !== "") s.push("");
    s.push("```");
  } else if (readmeUsage && !isMostlyInstall(readmeUsage)) {
    // README usage section (skip if mostly install instructions)
    const usageLines = readmeUsage.split("\n").slice(0, 15);
    for (const line of usageLines) s.push(line);
  } else if (readmeQuickStart && !isMostlyInstall(readmeQuickStart)) {
    // README Quick Start (skip if mostly install instructions)
    const qsLines = readmeQuickStart.split("\n").slice(0, 30);
    for (const line of qsLines) s.push(line);
  } else if (readmeSections && readmeSections.codeBlocks.length > 0) {
    // Fallback: use first code blocks from README
    for (const block of readmeSections.codeBlocks.slice(0, 2)) {
      s.push(`\`\`\`${block.lang}`);
      s.push(block.code);
      s.push("```");
      s.push("");
    }
  } else if (isCli && curated) {
    // CLI tool with curated metadata but no README content — generate install + usage
    const installCmd = inferInstallCommand(tool, curated);
    s.push("```bash");
    s.push(`# Install`);
    s.push(installCmd);
    s.push("");
    s.push(`# Show help`);
    s.push(`${name} --help`);
    s.push("```");
  } else {
    s.push("```bash");
    s.push(`# Show help and available options`);
    s.push(`${binName} --help`);
    s.push("");
    s.push(`# Check version`);
    s.push(`${name} --version`);
    s.push("");
    s.push("```");
  }
  s.push("");

  // ── Commands (compact — top 5 inline, always link to references) ──
  if (commands.length > 0) {
    s.push("## Commands");
    s.push("");
    const inlineCommands = commands.slice(0, 5);
    for (const cmd of inlineCommands) {
      const flagStr = cmd.flags.length > 0
        ? " — flags: " + cmd.flags.slice(0, 3).map(f => `\`${f.alias || f.name}\``).join(", ")
        : "";
      s.push(`- \`${name} ${cmd.name}\` — ${cmd.description || "(no description)"}${flagStr}`);
    }
    if (commands.length > 5) {
      s.push("");
      s.push(`_${commands.length - 5} more commands — see [commands reference](references/commands.md)_`);
    }
    s.push("");
  }

  // ── Global Options (compact) ──
  if (flags.length > 0) {
    s.push("## Global Options");
    s.push("");
    for (const f of flags) {
      const alias = f.alias ? ` (${f.alias})` : "";
      s.push(`- \`${f.name}\`${alias} — ${f.description}`);
    }
    s.push("");
  }

  // ── Current Environment (dynamic injection) ──
  if (isCli && commands.length > 0) {
    s.push("## Current Environment");
    s.push("");
    s.push(`- Version: !\`${binName} --version 2>/dev/null || echo "not installed"\``);
    s.push(`- Help: !\`${binName} --help 2>/dev/null | head -5\``);
    s.push("");
  }

  // ── References (always present — content lives in references/) ──
  s.push("## References");
  s.push("");
  s.push("- [Guide](references/guide.md) — Installation, configuration, detailed examples");
  if (commands.length > 0) {
    s.push(`- [Commands](references/commands.md) — Full command reference (${commands.length} commands)`);
  }
  s.push("- [Examples](references/examples.md) — Common usage patterns and recipes");
  s.push("- [Troubleshooting](references/troubleshooting.md) — Common issues and fixes");
  if (helpLines.length > 0) {
    s.push("- [Help Output](references/help-output.md) — Raw help text");
  }
  if (commands.some(c => c.flags.length > 3)) {
    s.push("- [Flags](references/flags.md) — Detailed flag reference per command");
  }
  s.push("");

  // ── Scripts ──
  s.push("## Scripts");
  s.push("");
  s.push("- `scripts/install.sh` — Install this tool");
  s.push("- `scripts/validate.py` — Validate skill compliance (run: `uv run scripts/validate.py`)");
  s.push("");

  return s.join("\n");
}

/**
 * Generate a full skill directory: SKILL.md + reference files.
 * Returns a SkillDirectory with the main file and any overflow content.
 */
export function generateSkillDirectory(tool: Tool): SkillDirectory {
  const skillMd = generateRichSkillMd(tool);
  const files: Record<string, string> = {};
  const commands = tool.capabilities.commands;
  const name = tool.meta.name;
  const desc = normalizeDesc(tool);
  const domain = inferDomain(tool);
  const refs = computeRefDecisions(tool);
  const curated = tool._curatedMeta;
  const readmeSections = tool._readmeSections;
  const isLibrary = commands.length === 0;
  // Use curated description for guide/examples if available and desc is generic
  const richDesc = (curated && desc.length < 30) ? curated.description : desc;

  // ── references/commands.md — always when commands exist ──
  if (refs.hasRefCommands) {
    const lines: string[] = [`# ${name} — Full Command Reference`, ""];
    for (const cmd of commands) {
      lines.push(`## \`${name} ${cmd.name}\``);
      lines.push("");
      if (cmd.description) lines.push(cmd.description);
      lines.push("");
      if (cmd.flags.length > 0) {
        lines.push("**Flags:**");
        for (const f of cmd.flags) {
          const alias = f.alias ? ` (${f.alias})` : "";
          lines.push(`- \`${f.name}\`${alias} — ${f.description}`);
        }
        lines.push("");
      }
    }
    files["references/commands.md"] = lines.join("\n");
  }

  // ── references/help-output.md — when raw help is long ──
  if (refs.hasRefHelp) {
    files["references/help-output.md"] = [
      `# ${name} — Help Output`,
      "",
      "```",
      refs.helpLines.join("\n"),
      "```",
      "",
    ].join("\n");
  }

  // ── references/flags.md — when commands have many flags ──
  const cmdsWithFlags = commands.filter(c => c.flags.length > 3);
  if (refs.hasRefFlags && cmdsWithFlags.length > 0) {
    const lines: string[] = [`# ${name} — Detailed Flag Reference`, ""];
    for (const cmd of cmdsWithFlags) {
      lines.push(`## \`${name} ${cmd.name}\``);
      lines.push("");
      lines.push("| Flag | Alias | Type | Required | Description |");
      lines.push("|------|-------|------|----------|-------------|");
      for (const f of cmd.flags) {
        lines.push(`| \`${f.name}\` | ${f.alias ? `\`${f.alias}\`` : "—"} | ${f.type} | ${f.required ? "yes" : "no"} | ${f.description} |`);
      }
      lines.push("");
    }
    files["references/flags.md"] = lines.join("\n");
  }

  // ── references/guide.md — ALWAYS generated ──
  // Focuses on installation, configuration, and integration (NOT usage examples —
  // those belong in examples.md to avoid duplication).
  {
    const lines: string[] = [
      `# ${name} — Setup & Configuration Guide`,
      "",
      richDesc + ".",
      "",
    ];
    if (curated) {
      lines.push(`**Agent value**: ${curated.agentValue}`);
      lines.push("");
      lines.push(`**Category**: ${curated.category}`);
      lines.push("");
    }
    if (tool.meta.homepage) {
      lines.push(`Official docs: ${tool.meta.homepage}`);
      lines.push("");
    }
    if (tool.source.format === "github") {
      lines.push(`Source: https://github.com/${tool.source.uri}`);
      lines.push("");
    }
    // Add README description section if available
    const readmeDesc = readmeSections?.sections["description"]
      ?? readmeSections?.sections["about"]
      ?? readmeSections?.sections["overview"];
    if (readmeDesc) {
      lines.push("## Description");
      lines.push("");
      const descLines = readmeDesc.split("\n").slice(0, 30);
      for (const dl of descLines) lines.push(dl);
      lines.push("");
    }

    lines.push("## Installation");
    lines.push("");
    // Use README installation section if available
    const readmeInstallGuide = readmeSections?.sections["installation"]
      ?? readmeSections?.sections["install"]
      ?? readmeSections?.sections["setup"];
    if (readmeInstallGuide) {
      const installLines = readmeInstallGuide.split("\n").slice(0, 25);
      for (const il of installLines) lines.push(il);
      lines.push("");
    } else if (isLibrary) {
      // Library: project-local install, not global
      lines.push("```bash");
      lines.push(inferLibraryInstallCommand(tool));
      lines.push("```");
    } else if (curated) {
      lines.push("```bash");
      lines.push(inferInstallCommand(tool, curated));
      lines.push("```");
    } else if (tool.source.format === "github") {
      const lang = detectToolLanguage(tool);
      lines.push("```bash");
      switch (lang) {
        case "rust":
          lines.push(`cargo binstall ${name}`);
          lines.push(`# Or: cargo install ${name}`);
          break;
        case "go":
          lines.push(`go install github.com/${tool.source.uri}@latest`);
          break;
        case "python":
          lines.push(`uv tool install ${name}`);
          lines.push(`# Or: pip install ${name}`);
          break;
        case "node":
          lines.push(`npm install -g ${name}`);
          break;
        default:
          lines.push(`# Download from https://github.com/${tool.source.uri}/releases`);
          lines.push(`brew install ${name} # or download binary`);
          break;
      }
      lines.push("```");
    } else if (tool.source.format === "npm") {
      lines.push("```bash");
      lines.push(isLibrary ? `npm install ${tool.source.uri.replace("npm:", "")}` : `npm install -g ${tool.source.uri.replace("npm:", "")}`);
      lines.push("```");
    } else if (tool.source.format === "pypi") {
      lines.push("```bash");
      const pypiPkg = tool.source.uri.replace("pypi:", "");
      if (isLibrary) {
        lines.push(`pip install ${pypiPkg}`);
        lines.push(`# Or: uv add ${pypiPkg}`);
      } else {
        lines.push(`uv tool install ${pypiPkg}`);
        lines.push(`# Or: pip install ${pypiPkg}`);
      }
      lines.push("```");
    } else if (tool.source.format === "crates") {
      lines.push("```bash");
      lines.push(`cargo binstall ${tool.source.uri.replace("crates:", "")}`);
      lines.push(`# Or: cargo install ${tool.source.uri.replace("crates:", "")}`);
      lines.push("```");
    }
    lines.push("");

    // Configuration section (from README if available)
    const readmeConfig = readmeSections?.sections["configuration"]
      ?? readmeSections?.sections["config"]
      ?? readmeSections?.sections["settings"]
      ?? readmeSections?.sections["options"];
    if (readmeConfig) {
      lines.push("## Configuration");
      lines.push("");
      const configLines = readmeConfig.split("\n").slice(0, 30);
      for (const cl of configLines) lines.push(cl);
      lines.push("");
    }

    // Integration section (from README if available)
    const readmeIntegration = readmeSections?.sections["integration"]
      ?? readmeSections?.sections["integrations"]
      ?? readmeSections?.sections["editor integration"]
      ?? readmeSections?.sections["ci/cd"]
      ?? readmeSections?.sections["pre-commit"]
      ?? readmeSections?.sections["plugins"];
    if (readmeIntegration) {
      lines.push("## Integration");
      lines.push("");
      const intLines = readmeIntegration.split("\n").slice(0, 25);
      for (const il of intLines) lines.push(il);
      lines.push("");
    }

    // Domain-specific getting started content when guide is thin
    // (no README description, no config, no integration sections found)
    const hasReadmeContent = !!(readmeSections?.sections["description"]
      || readmeSections?.sections["about"]
      || readmeSections?.sections["overview"]
      || readmeSections?.sections["configuration"]
      || readmeSections?.sections["config"]
      || readmeSections?.sections["integration"]);
    if (!hasReadmeContent && domain.quickStart.length > 0) {
      lines.push("## Getting Started");
      lines.push("");
      lines.push("```bash");
      for (const qs of domain.quickStart) lines.push(qs);
      lines.push("```");
      lines.push("");
    }
    if (!hasReadmeContent && domain.troubleshooting.length > 0) {
      lines.push("## Common Issues");
      lines.push("");
      for (const ts of domain.troubleshooting) lines.push(`- ${ts}`);
      lines.push("");
    }

    // Tags
    const tagList = tool.meta.tags as string[];
    if (tagList.length > 0) {
      lines.push("## Related Topics");
      lines.push("");
      lines.push(`Tags: ${tagList.join(", ")}`);
      lines.push("");
    }
    files["references/guide.md"] = lines.join("\n");
  }

  // ── references/examples.md — ALWAYS generated (real usage patterns + recipes) ──
  // This file focuses on USAGE examples only — no install commands, no config.
  // guide.md covers installation/configuration; this file covers "how to use it".
  {
    const lines: string[] = [`# ${name} — Common Usage Patterns`, ""];
    if (curated) {
      lines.push(`> ${curated.agentValue}`);
      lines.push("");
    }

    // Use README usage/examples sections if available
    const readmeUsage = readmeSections?.sections["usage"]
      ?? readmeSections?.sections["basic usage"]
      ?? readmeSections?.sections["examples"]
      ?? readmeSections?.sections["example"];
    if (readmeUsage) {
      lines.push("## Usage (from README)");
      lines.push("");
      const usageLines = readmeUsage.split("\n").slice(0, 40);
      for (const ul of usageLines) lines.push(ul);
      lines.push("");
    }

    // Also pull advanced usage sections that guide.md doesn't include
    const readmeAdvanced = readmeSections?.sections["advanced usage"]
      ?? readmeSections?.sections["advanced"]
      ?? readmeSections?.sections["recipes"]
      ?? readmeSections?.sections["cookbook"];
    if (readmeAdvanced) {
      lines.push("## Advanced Usage");
      lines.push("");
      const advLines = readmeAdvanced.split("\n").slice(0, 30);
      for (const al of advLines) lines.push(al);
      lines.push("");
    }

    lines.push("## Patterns");
    lines.push("");
    if (commands.length > 0) {
      // Real CLI commands — show concrete usage patterns
      const binNameForExamples = inferBinName(tool);
      lines.push("```bash");
      for (const cmd of commands.slice(0, MAX_PATTERN_EXAMPLES)) {
        lines.push(`# ${cmd.description || cmd.name}`);
        lines.push(concreteArgs(cmd, binNameForExamples));
        lines.push("");
      }
      lines.push("```");
    } else if (readmeSections && readmeSections.codeBlocks.length > 0) {
      // Compute which blocks were used in Quick Start (first 2 api-like blocks) for dedup
      const quickStartCodes = new Set<string>();
      if (isLibrary) {
        const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        let apiCount = 0;
        for (const b of readmeSections.codeBlocks) {
          if (apiCount >= 2) break;
          const code = b.code.toLowerCase();
          if (INSTALL_CMD_RE.test(code) && code.split("\n").length < 3) continue;
          const isApi = code.includes("import ") || code.includes("require(") || code.includes("from ")
            || code.includes(safeName)
            || b.lang === "yaml" || b.lang === "yml" || b.lang === "toml"
            || b.lang === "python" || b.lang === "javascript" || b.lang === "typescript";
          if (isApi) { quickStartCodes.add(b.code); apiCount++; }
        }
      }
      // Use actual code blocks from the README (exclude install/output blocks and blocks already in Quick Start)
      const usageBlocks = readmeSections.codeBlocks.filter(b => {
        if (b.purpose === "install" || b.purpose === "output") return false;
        if (quickStartCodes.has(b.code)) return false;
        const bLines = b.code.split("\n").filter(l => l.trim().length > 0);
        return !bLines.every(l => INSTALL_CMD_RE.test(l.trim())
          || l.trim().startsWith("#") || l.trim().startsWith("$") && l.trim().length < 5);
      });
      if (usageBlocks.length > 0) {
        for (const block of usageBlocks.slice(0, 5)) {
          lines.push(`\`\`\`${block.lang}`);
          lines.push(block.code);
          lines.push("```");
          lines.push("");
        }
      } else {
        // All code blocks were install-only — provide API stub
        generateExamplesStub(lines, tool, name, curated ?? undefined);
      }
    } else if (isLibrary) {
      // Library with no README code blocks — generate language-appropriate API stub
      generateExamplesStub(lines, tool, name, curated ?? undefined);
    } else if (domain.patterns.length > 0 && isLikelyCli(tool)) {
      // Domain patterns — only for confirmed CLI tools
      lines.push("```bash");
      for (const line of domain.patterns) lines.push(line);
      if (domain.patterns[domain.patterns.length - 1] !== "") lines.push("");
      lines.push("```");
    } else {
      // Minimal — point to docs instead of fabricating commands
      const docsUrl = tool.meta.homepage || `https://github.com/${tool.source.uri}`;
      lines.push(`See the [project documentation](${docsUrl}) for usage examples.`);
    }
    lines.push("");
    files["references/examples.md"] = lines.join("\n");
  }

  // ── references/troubleshooting.md — ALWAYS generated ──
  {
    const lines: string[] = [`# ${name} — Troubleshooting`, ""];

    // Use README troubleshooting/FAQ section if available — check many heading variants
    const readmeTrouble = readmeSections?.sections["troubleshooting"]
      ?? readmeSections?.sections["faq"]
      ?? readmeSections?.sections["common issues"]
      ?? readmeSections?.sections["known issues"]
      ?? readmeSections?.sections["gotchas"]
      ?? readmeSections?.sections["caveats"]
      ?? readmeSections?.sections["common problems"]
      ?? readmeSections?.sections["debugging"];
    if (readmeTrouble) {
      const troubleLines = readmeTrouble.split("\n").slice(0, 30);
      for (const tl of troubleLines) lines.push(tl);
    } else if (commands.length > 0 && domain.troubleshooting.length > 0 && isLikelyCli(tool)) {
      // Only use domain template for confirmed CLI tools (not libraries)
      for (const tip of domain.troubleshooting) {
        lines.push(`- ${tip}`);
      }
    } else {
      // Ecosystem-aware troubleshooting using detectToolLanguage()
      const lang = detectToolLanguage(tool);
      const releasesUrl = tool.meta.homepage || `https://github.com/${tool.source.uri}/releases`;

      switch (lang) {
        case "python":
          lines.push(`- **Installation fails**: Check Python version (3.10+ recommended): \`python3 --version\``);
          lines.push(`- **Import errors**: Verify the package is installed: \`pip list | grep ${name}\``);
          lines.push(`- **Version mismatch**: Update to latest: \`pip install --upgrade ${name}\``);
          lines.push(`- **Virtual env issues**: Create a clean venv: \`uv venv && uv pip install ${name}\``);
          break;
        case "node":
          lines.push(`- **Installation fails**: Check Node.js version (18+ recommended): \`node --version\``);
          lines.push(`- **Module not found**: Verify installation: \`npm list -g ${name}\``);
          lines.push(`- **Version mismatch**: Update to latest: \`npm update -g ${name}\``);
          lines.push(`- **Permission errors**: Use \`npx ${name}\` instead of global install`);
          break;
        case "rust":
          lines.push(`- **Installation fails**: Install Rust toolchain: \`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\``);
          lines.push(`- **Binary not found**: Ensure \`~/.cargo/bin\` is in your PATH: \`echo $PATH | grep cargo\``);
          lines.push(`- **Build from source fails**: Check MSRV in Cargo.toml, update Rust: \`rustup update\``);
          lines.push(`- **Version mismatch**: Update: \`cargo install ${name}\` or download from [releases](${releasesUrl})`);
          break;
        case "go":
          lines.push(`- **Binary not found**: Download from [releases](${releasesUrl}) or \`go install github.com/${tool.source.uri}@latest\``);
          lines.push(`- **GOBIN not in PATH**: Add \`export PATH=$PATH:$(go env GOPATH)/bin\` to your shell profile`);
          lines.push(`- **Build fails**: Check Go version: \`go version\` (1.21+ recommended)`);
          lines.push(`- **Version mismatch**: \`go install github.com/${tool.source.uri}@latest\``);
          break;
        case "c":
          lines.push(`- **Build fails**: Install build dependencies: \`apt install build-essential\` or \`xcode-select --install\``);
          lines.push(`- **Binary not found**: Download from [releases](${releasesUrl}) or build from source`);
          lines.push(`- **Missing libraries**: Check README for required system dependencies`);
          break;
        default:
          lines.push(`- **Binary not found**: Download from [releases](${releasesUrl})`);
          lines.push(`- **Installation fails**: Try \`brew install ${name}\` or see project README`);
          lines.push(`- **Version mismatch**: Download latest release from [releases](${releasesUrl})`);
          break;
      }
    }
    lines.push("");
    files["references/troubleshooting.md"] = lines.join("\n");
  }

  // ── scripts/install.sh — ALWAYS generated ──
  files["scripts/install.sh"] = generateInstallScript(tool);

  // ── scripts/validate.py — ALWAYS generated ──
  files["scripts/validate.py"] = generateValidateScript();

  // ── scripts/run-headless.sh — headless claude -p wrapper ──
  if (commands.length > 0) {
    const binNameH = inferBinName(tool);
    files["scripts/run-headless.sh"] = generateHeadlessScript(name, binNameH);
  }

  // ── scripts/test.sh — smoke test ──
  {
    const binNameT = inferBinName(tool);
    files["scripts/test.sh"] = generateTestScript(name, binNameT, tool);
  }

  return { skillMd, files };
}

// =============================================================================
// Script Generators (used by generateSkillDirectory and skill-forge)
// =============================================================================

/** Generate scripts/install.sh — source-aware install helper */
export function generateInstallScript(tool: Tool): string {
  validateToolName(tool.meta.name);
  const name = shellQuote(tool.meta.name);
  const isCli = isLikelyCli(tool);
  const lines: string[] = [
    "#!/usr/bin/env bash",
    `# Install ${tool.meta.name} — auto-detected from source format`,
    "set -euo pipefail",
    "",
  ];

  const pkg = shellQuote(tool.source.uri.replace(/^(pypi|crates|npm):/, ""));

  switch (tool.source.format) {
    case "npm":
      if (isCli) {
        lines.push(`# Install via npm (global)`, `npm install -g ${pkg}`, "");
        lines.push(`# Or run without installing`, `npx ${pkg} --help`);
      } else {
        lines.push(`# Install as project dependency`, `npm install ${pkg}`, "");
        lines.push(`# Or run without installing`, `npx ${pkg}`);
      }
      break;
    case "pypi":
      if (isCli) {
        lines.push(`# Install via uv (recommended)`, `uv tool install ${pkg}`, "");
        lines.push(`# Or run without installing`, `uvx ${pkg} --help`);
      } else {
        lines.push(`# Install as project dependency`, `pip install ${pkg}`, "");
        lines.push(`# Or with uv`, `uv add ${pkg}`);
      }
      break;
    case "crates":
      lines.push(`# Install via cargo-binstall (fast, pre-built binaries)`, `cargo binstall ${pkg}`, "");
      lines.push(`# Or build from source`, `cargo install ${pkg}`);
      break;
    case "github": {
      const uri = shellQuote(tool.source.uri);
      const lang = detectToolLanguage(tool);
      switch (lang) {
        case "rust":
          lines.push(`# Install via cargo-binstall (pre-built binaries)`);
          lines.push(`cargo binstall ${name}`, "");
          lines.push(`# Or build from source`);
          lines.push(`cargo install --git "https://github.com/"${uri}".git"`);
          break;
        case "go":
          lines.push(`# Install via go install`);
          lines.push(`go install "github.com/"${uri}"@latest"`, "");
          lines.push(`# Or download binary from releases`);
          lines.push(`# https://github.com/${tool.source.uri}/releases`);
          break;
        case "python":
          lines.push(`# Install via uv (recommended)`);
          lines.push(`uv tool install ${name}`, "");
          lines.push(`# Or: pip install ${name}`);
          break;
        case "node":
          lines.push(`# Install via npm`);
          lines.push(`npm install -g ${name}`, "");
          lines.push(`# Or run without installing`);
          lines.push(`npx ${name} --help`);
          break;
        default:
          lines.push(`# Download pre-built binary from releases`);
          lines.push(`# https://github.com/${tool.source.uri}/releases`, "");
          lines.push(`# Or install via package manager`);
          lines.push(`brew install ${name} 2>/dev/null || echo "See project README"`, "");
          lines.push(`# Or build from source`);
          lines.push(`git clone "https://github.com/"${uri}".git" && cd ${name}`);
          break;
      }
      break;
    }
    default:
      lines.push(`# Install from: ${tool.source.uri}`);
      lines.push(`echo "See project README for installation instructions"`);
  }

  lines.push("");
  if (isCli) {
    lines.push(`# Verify installation`);
    lines.push(`${name} --version 2>/dev/null || ${name} version 2>/dev/null || echo ${shellQuote(tool.meta.name + " installed (no --version flag)")}`);
  } else {
    lines.push(`# Verify installation`);
    const lang = detectToolLanguage(tool);
    if (lang === "python") {
      const pyMod = tool.meta.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      lines.push(`python -c "import ${pyMod}; print(${shellQuote(tool.meta.name + " installed")})" 2>/dev/null || echo ${shellQuote(tool.meta.name + " installed (verify with: pip show " + tool.meta.name + ")")}`);
    } else if (lang === "node") {
      const pkgQ = shellQuote(tool.source.uri.replace(/^npm:/, ""));
      lines.push(`node -e "require(${pkgQ})" 2>/dev/null || echo ${shellQuote(tool.meta.name + " installed (verify with: npm list " + tool.meta.name + ")")}`);
    } else {
      lines.push(`echo ${shellQuote(tool.meta.name + " installed — verify by importing in your project")}`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

/**
 * Generate scripts/validate.py — a single-file uv script that validates
 * the skill directory structure and frontmatter compliance.
 * Runs with: uv run scripts/validate.py
 */
export function generateValidateScript(): string {
  return `#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml>=6.0"]
# ///
"""
Validate skill directory structure and SKILL.md frontmatter.
Usage: uv run scripts/validate.py
"""

import sys
import re
from pathlib import Path

try:
    import yaml
except ImportError:
    print("WARN: pyyaml not available, using basic parsing")
    yaml = None

SKILL_DIR = Path(__file__).resolve().parent.parent
SKILL_FILE = SKILL_DIR / "SKILL.md"

def check(condition: bool, msg: str, issues: list[str]) -> None:
    if not condition:
        issues.append(msg)

def validate() -> list[str]:
    issues: list[str] = []

    check(SKILL_FILE.exists(), "SKILL.md not found", issues)
    check(not (SKILL_DIR / "README.md").exists(), "README.md should not be inside skill folder", issues)

    if not SKILL_FILE.exists():
        return issues

    content = SKILL_FILE.read_text(encoding="utf-8")

    fm_match = re.match(r"^---\\r?\\n([\\s\\S]*?)\\r?\\n---", content)
    check(fm_match is not None, "Missing --- frontmatter delimiters", issues)
    if not fm_match:
        return issues

    fm_text = fm_match.group(1)
    fields: dict = {}
    if yaml:
        try:
            fields = yaml.safe_load(fm_text) or {}
        except yaml.YAMLError as e:
            issues.append(f"Invalid YAML: {e}")
            return issues
    else:
        for line in fm_text.split("\\n"):
            m = re.match(r"^(\\w[\\w-]*):\\s*(.+)$", line)
            if m:
                fields[m.group(1)] = m.group(2).strip().strip("'\\"")

    name = fields.get("name", "")
    check(bool(name), "Missing: name", issues)
    check(len(name) <= 64, f"name too long: {len(name)} (max 64)", issues)
    check(bool(re.match(r"^[a-z0-9][a-z0-9-]*$", name)) if name else False, f"name not kebab-case: '{name}'", issues)
    check("claude" not in name.lower() and "anthropic" not in name.lower(), "name has reserved words", issues)

    desc = fields.get("description", "")
    check(bool(desc), "Missing: description", issues)
    check(len(desc) <= 1024, f"description too long: {len(desc)} (max 1024)", issues)
    check("<" not in desc and ">" not in desc, "description has XML tags", issues)
    check("use when" in desc.lower(), "description missing 'Use when' trigger", issues)

    # Structure checks
    refs_dir = SKILL_DIR / "references"
    scripts_dir = SKILL_DIR / "scripts"
    check(refs_dir.exists(), "Missing references/ directory", issues)
    check(scripts_dir.exists(), "Missing scripts/ directory", issues)
    if refs_dir.exists():
        check((refs_dir / "guide.md").exists(), "Missing references/guide.md", issues)

    return issues

if __name__ == "__main__":
    issues = validate()
    if issues:
        print(f"FAIL: {len(issues)} issue(s)")
        for i in issues:
            print(f"  - {i}")
        sys.exit(1)
    else:
        print("PASS: Skill is compliant")
`;
}

/** Generate a headless claude -p wrapper script */
function generateHeadlessScript(name: string, binName: string): string {
  return [
    "#!/bin/bash",
    "set -euo pipefail",
    `# Headless wrapper for ${name} via claude -p`,
    `# Usage: bash scripts/run-headless.sh "your task description"`,
    "",
    'TASK="${1:-"Run ' + binName + ' --help and summarize the output"}"',
    "",
    `claude -p "Using the ${name} tool (binary: ${binName}), please: $TASK" \\`,
    `  --allowedTools "Bash(${binName} *)" "Read" "Grep"`,
    "",
  ].join("\n");
}

/** Generate a smoke test script */
function generateTestScript(name: string, binName: string, _tool: Tool): string {
  const checks: string[] = [];
  checks.push(`# Check if ${binName} is installed`);
  checks.push(`if command -v ${shellQuote(binName)} >/dev/null 2>&1; then`);
  checks.push(`  echo "PASS: ${binName} is installed"`);
  checks.push(`  ${shellQuote(binName)} --version 2>/dev/null && echo "PASS: --version works" || echo "WARN: --version failed"`);
  checks.push(`  ${shellQuote(binName)} --help 2>/dev/null | head -1 && echo "PASS: --help works" || echo "WARN: --help failed"`);
  checks.push("else");
  checks.push(`  echo "FAIL: ${binName} is not installed"`);
  checks.push("  exit 1");
  checks.push("fi");

  return [
    "#!/bin/bash",
    "set -uo pipefail",
    `# Smoke test for ${name}`,
    "",
    ...checks,
    "",
    "echo 'Smoke test complete'",
    "",
  ].join("\n");
}

/** Generate a new SKILL.md scaffold with compliant description */
export function generateSkillMd(name: string, description: string): string {
  const desc = description.replace(/\.$/, "");
  const triggerDesc = `${desc}. Use when the user needs ${name} or works on ${desc.toLowerCase()}-related tasks.`;

  return [
    "---",
    `name: ${name}`,
    "version: 0.1.0",
    `description: ${triggerDesc}`,
    "ingredients: []",
    "tags:",
    `  - ${name}`,
    "---",
    "",
    `# ${name}`,
    "",
    desc + ".",
    "",
    "## Quick Start",
    "",
    "```bash",
    `# Example usage`,
    `${name} --help`,
    "```",
    "",
    "## Common Patterns",
    "",
    "Add concrete usage patterns here.",
    "",
  ].join("\n");
}

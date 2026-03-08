#!/usr/bin/env npx tsx
/**
 * trending-pipeline.ts
 *
 * Full pipeline: scrape GitHub trending repos → resolve → install → analyze → generate SKILL.md
 * Usage: npx tsx examples/trending-pipeline.ts [--language <lang>] [--since daily|weekly|monthly] [--limit <n>] [--dry-run]
 */

import { createResolver } from "../lib/resolver.js";
import { createInstaller } from "../lib/installer.js";
import { createAnalyzer, findMainBinary } from "../lib/analyzer.js";
import { createStore, getToolInstallDir, generateContextMd } from "../lib/store.js";
import { generateSkillMd, parseFrontmatter, buildContext, installTool } from "../lib/skills.js";
import { readPkgVersion, readPkgJson } from "../lib/pkg-utils.js";
import type { Tool, ToolCapabilities, Skill } from "../lib/types.js";
import { get as httpsGet } from "node:https";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

// ── Config ───────────────────────────────────────────────────────────────────
const DATA_DIR = join(homedir(), ".agents-cli");
const OUTPUT_DIR = resolve("examples/generated-skills");

interface TrendingRepo {
  owner: string;
  repo: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  url: string;
}

// ── CLI Args ─────────────────────────────────────────────────────────────────
function parseCliArgs() {
  const args = process.argv.slice(2);
  let language = "";
  let since = "monthly";
  let limit = 25;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--language" && args[i + 1]) { language = args[++i]!; }
    else if (arg === "--since" && args[i + 1]) { since = args[++i]!; }
    else if (arg === "--limit" && args[i + 1]) { limit = parseInt(args[++i]!, 10); }
    else if (arg === "--dry-run") { dryRun = true; }
  }
  return { language, since, limit, dryRun };
}

// ── Scrape GitHub Trending ───────────────────────────────────────────────────
function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { "User-Agent": "agents-cli/0.1.0", Accept: "text/html" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchHtml(res.headers.location).then(resolve, reject);
        return;
      }
      let data = "";
      res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function scrapeTrending(language: string, since: string): Promise<TrendingRepo[]> {
  const langPath = language ? `/${encodeURIComponent(language)}` : "";
  const url = `https://github.com/trending${langPath}?since=${since}`;
  console.log(`\n📡 Fetching trending repos from: ${url}\n`);

  const html = await fetchHtml(url);
  const repos: TrendingRepo[] = [];

  // Parse the HTML for repo entries — each article.Box-row contains a trending repo
  const articleRegex = /<article class="Box-row">([\s\S]*?)<\/article>/g;
  let match: RegExpExecArray | null;

  while ((match = articleRegex.exec(html)) !== null) {
    const block = match[1]!;

    // Extract owner/repo from the <h2> link
    const linkMatch = /href="\/([^/]+)\/([^/"]+)"/.exec(block);
    if (!linkMatch?.[1] || !linkMatch[2]) continue;

    const owner = linkMatch[1];
    const repo = linkMatch[2];

    // Extract description
    const descMatch = /<p class="[^"]*?">([\s\S]*?)<\/p>/.exec(block);
    const description = descMatch?.[1]?.trim().replace(/<[^>]+>/g, "").replace(/\s+/g, " ") ?? "";

    // Extract language
    const langMatch = /itemprop="programmingLanguage">([\s\S]*?)<\/span>/.exec(block);
    const lang = langMatch?.[1]?.trim() ?? "Unknown";

    // Extract stars (approximate from text)
    const starsMatch = /(\d[\d,]*)\s*stars?\s*today/i.exec(block) ?? /href="\/[^"]*\/stargazers"[^>]*>\s*([\d,]+)/i.exec(block);
    const stars = starsMatch?.[1] ? parseInt(starsMatch[1].replace(/,/g, ""), 10) : 0;

    repos.push({
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      description,
      language: lang,
      stars,
      url: `https://github.com/${owner}/${repo}`,
    });
  }

  return repos;
}

// ── CLI Detection Heuristics ─────────────────────────────────────────────────
/** Heuristics to determine if a repo is likely a CLI tool */
function isLikelyCli(repo: TrendingRepo): { likely: boolean; reason: string } {
  const desc = (repo.description + " " + repo.repo).toLowerCase();

  // Strong CLI signals
  const cliKeywords = [
    "cli", "command-line", "command line", "terminal", "console",
    "tool", "utility", "linter", "formatter", "bundler", "compiler",
    "package manager", "task runner", "build tool", "dev tool",
    "shell", "prompt", "tui", "curses",
  ];

  for (const kw of cliKeywords) {
    if (desc.includes(kw)) return { likely: true, reason: `keyword: "${kw}"` };
  }

  // Language-based heuristics — Rust/Go repos are often CLIs
  if (["Rust", "Go"].includes(repo.language)) {
    const toolSuffixes = ["ctl", "sh", "cli", "tool", "ls", "cat", "grep", "find", "top", "stat"];
    for (const suffix of toolSuffixes) {
      if (repo.repo.toLowerCase().endsWith(suffix)) {
        return { likely: true, reason: `${repo.language} repo with tool-like name` };
      }
    }
  }

  // Check for common CLI-related repo name patterns
  const cliNamePatterns = [
    /^(go|py|node|rust)?-?\w+(ctl|sh|cli|tool)$/i,
    /^(n|bun|pnpm|yarn|deno|cargo|pip)$/i,
  ];
  for (const pattern of cliNamePatterns) {
    if (pattern.test(repo.repo)) return { likely: true, reason: "name pattern match" };
  }

  return { likely: false, reason: "no CLI signals detected" };
}

// ── Pipeline: Install + Analyze + Generate Skill ─────────────────────────────
async function processRepo(
  repo: TrendingRepo,
  store: ReturnType<typeof createStore>,
): Promise<{ tool: Tool; skillPath: string } | null> {
  const source = `${repo.owner}/${repo.repo}`;

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Processing: ${repo.fullName}`);
  console.log(`  ${repo.description}`);
  console.log(`  Language: ${repo.language} | Stars today: ${repo.stars}`);
  console.log(`${"─".repeat(60)}`);

  try {
    // Step 1: Resolve
    console.log(`  [1/4] Resolving ${source}...`);
    const resolver = createResolver();
    if (!resolver.supports(source)) {
      console.log(`  ⚠ Unsupported source format, skipping`);
      return null;
    }
    const resolved = await resolver.resolve(source);
    const toolId = resolved.meta.name ?? source.replace(/[/@]/g, "-").replace(/^-/, "");
    console.log(`  → ${resolved.source.format}:${resolved.source.uri} (${toolId})`);

    // Check if already installed
    if (await store.has(toolId)) {
      console.log(`  ℹ Already installed, loading existing data...`);
      const existing = await store.get(toolId);
      if (existing) {
        const skillPath = generateSkillForTool(existing, repo);
        return { tool: existing, skillPath };
      }
    }

    // Step 2: Install
    console.log(`  [2/4] Installing...`);
    const tool = await installTool(source, DATA_DIR, { store, verbose: true });
    console.log(`  ✓ Installed ${tool.meta.name}@${tool.meta.version}`);

    // Step 3: Analyze (already done in installTool, report results)
    console.log(`  [3/4] Analysis: ${tool.capabilities.commands.length} commands, ${tool.capabilities.globalFlags.length} flags (${tool.capabilities.analysisMethod})`);
    if (tool.capabilities.commands.length > 0) {
      console.log(`  Commands: ${tool.capabilities.commands.map(c => c.name).join(", ")}`);
    }

    // Step 4: Generate Skill
    console.log(`  [4/4] Generating SKILL.md...`);
    const skillPath = generateSkillForTool(tool, repo);
    console.log(`  ✓ Skill written to: ${skillPath}`);

    return { tool, skillPath };
  } catch (err) {
    console.error(`  ✗ Failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

function generateSkillForTool(tool: Tool, repo: TrendingRepo): string {
  const skillDir = join(OUTPUT_DIR, tool.meta.name);
  mkdirSync(skillDir, { recursive: true });

  // Build a rich SKILL.md from the analyzed tool
  const commands = tool.capabilities.commands;
  const flags = tool.capabilities.globalFlags;

  // Create description with trigger hints
  const desc = tool.meta.description || repo.description || `A CLI tool from ${repo.fullName}`;
  const triggerHint = buildTriggerHint(tool, repo);

  const sections: string[] = [];

  // Frontmatter
  sections.push("---");
  sections.push(`name: ${tool.meta.name}`);
  sections.push(`version: ${tool.meta.version}`);
  sections.push(`description: "${escapeFrontmatter(desc)}. ${triggerHint}"`);
  sections.push(`ingredients:`);
  sections.push(`  - ${repo.fullName}`);
  sections.push(`tags:`);
  const tags = new Set<string>([...(tool.meta.tags as string[])]);
  if (repo.language !== "Unknown") tags.add(repo.language.toLowerCase());
  tags.add("cli");
  for (const tag of tags) {
    sections.push(`  - ${tag}`);
  }
  if (tool.meta.homepage) sections.push(`# homepage: ${tool.meta.homepage}`);
  if (tool.meta.license) sections.push(`# license: ${tool.meta.license}`);
  sections.push("---");
  sections.push("");

  // Body
  sections.push(`# ${tool.meta.name}`);
  sections.push("");
  sections.push(desc);
  sections.push("");

  if (tool.meta.homepage) {
    sections.push(`**Source**: ${repo.url}`);
    sections.push("");
  }

  // Commands reference
  if (commands.length > 0) {
    sections.push("## Commands");
    sections.push("");
    for (const cmd of commands) {
      sections.push(`### \`${tool.meta.name} ${cmd.name}\``);
      sections.push("");
      if (cmd.description) sections.push(cmd.description);
      sections.push("");
      if (cmd.flags.length > 0) {
        sections.push("**Flags:**");
        for (const f of cmd.flags) {
          const alias = f.alias ? ` (${f.alias})` : "";
          sections.push(`- \`${f.name}\`${alias} — ${f.description}`);
        }
        sections.push("");
      }
    }
  }

  // Global flags
  if (flags.length > 0) {
    sections.push("## Global Options");
    sections.push("");
    for (const f of flags) {
      const alias = f.alias ? ` (${f.alias})` : "";
      sections.push(`- \`${f.name}\`${alias} — ${f.description}`);
    }
    sections.push("");
  }

  // Usage examples placeholder
  sections.push("## Usage");
  sections.push("");
  if (commands.length > 0) {
    sections.push("```bash");
    sections.push(`# List available commands`);
    sections.push(`${tool.meta.name} --help`);
    sections.push("");
    // Show first few commands as examples
    for (const cmd of commands.slice(0, 3)) {
      sections.push(`# ${cmd.description || cmd.name}`);
      sections.push(`${tool.meta.name} ${cmd.name}`);
      sections.push("");
    }
    sections.push("```");
  } else {
    sections.push("```bash");
    sections.push(`${tool.meta.name} --help`);
    sections.push("```");
  }
  sections.push("");

  const content = sections.join("\n");
  const skillPath = join(skillDir, "SKILL.md");
  writeFileSync(skillPath, content, "utf-8");

  // Also write the CONTEXT.md for full reference
  const contextPath = join(skillDir, "CONTEXT.md");
  writeFileSync(contextPath, generateContextMd(tool), "utf-8");

  return skillPath;
}

function buildTriggerHint(tool: Tool, repo: TrendingRepo): string {
  const name = tool.meta.name;
  const commands = tool.capabilities.commands.map(c => c.name);

  if (commands.length > 0) {
    const topCmds = commands.slice(0, 5).join(", ");
    return `Use this skill when the user needs to ${name} (commands: ${topCmds}), even if they don't mention "${name}" explicitly`;
  }

  return `Use this skill when working with ${name}-related tasks`;
}

function escapeFrontmatter(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseCliArgs();

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     agents-cli: GitHub Trending → Skills Pipeline       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`  Language: ${opts.language || "all"}`);
  console.log(`  Period:   ${opts.since}`);
  console.log(`  Limit:    ${opts.limit}`);
  console.log(`  Dry run:  ${opts.dryRun}`);
  console.log(`  Output:   ${OUTPUT_DIR}`);

  // Step 1: Scrape trending repos
  const allRepos = await scrapeTrending(opts.language, opts.since);
  console.log(`\n📦 Found ${allRepos.length} trending repos\n`);

  if (allRepos.length === 0) {
    console.log("No trending repos found. GitHub may have changed their HTML structure.");
    console.log("Falling back to well-known CLI repos...");
    // Fallback: hardcoded list of popular CLI repos
    allRepos.push(
      ...getWellKnownCliRepos(),
    );
  }

  // Step 2: Filter for likely CLI tools
  const cliCandidates: { repo: TrendingRepo; reason: string }[] = [];
  const nonCli: TrendingRepo[] = [];

  for (const repo of allRepos) {
    const { likely, reason } = isLikelyCli(repo);
    if (likely) {
      cliCandidates.push({ repo, reason });
    } else {
      nonCli.push(repo);
    }
  }

  // Include non-CLI trending repos too (some have CLI components we'll discover at install)
  // If we have few CLI candidates, supplement with well-known CLI repos
  const supplementRepos = cliCandidates.length < 10 ? getWellKnownCliRepos() : [];
  const seen = new Set(allRepos.map(r => r.fullName));
  const extra = supplementRepos.filter(r => !seen.has(r.fullName));

  if (extra.length > 0) {
    console.log(`\n  + Supplementing with ${extra.length} well-known CLI repos`);
  }

  const toProcess = [
    ...cliCandidates.map(c => c.repo),
    ...nonCli,
    ...extra,
  ].slice(0, opts.limit);

  console.log(`\n🔍 CLI candidates: ${cliCandidates.length} (strong match)`);
  for (const { repo, reason } of cliCandidates.slice(0, opts.limit)) {
    console.log(`  ✓ ${repo.fullName} — ${reason}`);
  }

  if (nonCli.length > 0) {
    console.log(`\n  + ${Math.min(nonCli.length, opts.limit - cliCandidates.length)} more repos to probe`);
  }

  if (opts.dryRun) {
    console.log("\n🏁 Dry run complete. Pass without --dry-run to install and analyze.");
    return;
  }

  // Step 3: Process each repo through the full pipeline
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const store = createStore(DATA_DIR);

  const results: { repo: TrendingRepo; tool: Tool; skillPath: string }[] = [];
  const failures: { repo: TrendingRepo; error: string }[] = [];

  for (const repo of toProcess) {
    try {
      const result = await processRepo(repo, store);
      if (result) {
        results.push({ repo, ...result });
      } else {
        failures.push({ repo, error: "No CLI binary found or install skipped" });
      }
    } catch (err) {
      failures.push({ repo, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Step 4: Summary
  console.log("\n\n╔══════════════════════════════════════════════════════════╗");
  console.log("║                    Pipeline Summary                     ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  console.log(`  ✓ Successfully processed: ${results.length}`);
  console.log(`  ✗ Failed/skipped:         ${failures.length}`);
  console.log(`  📁 Output directory:      ${OUTPUT_DIR}\n`);

  if (results.length > 0) {
    console.log("  Generated Skills:");
    console.log("  ─────────────────");
    for (const r of results) {
      const cmdCount = r.tool.capabilities.commands.length;
      const flagCount = r.tool.capabilities.globalFlags.length;
      console.log(`  ${r.tool.meta.name}@${r.tool.meta.version}`);
      console.log(`    ${cmdCount} commands, ${flagCount} flags`);
      console.log(`    → ${r.skillPath}`);
    }
  }

  if (failures.length > 0) {
    console.log("\n  Failures:");
    console.log("  ─────────");
    for (const f of failures) {
      console.log(`  ${f.repo.fullName}: ${f.error}`);
    }
  }

  // Write a summary index
  const indexPath = join(OUTPUT_DIR, "INDEX.md");
  const indexLines = [
    "# Generated Skills from GitHub Trending",
    "",
    `Generated on ${new Date().toISOString()} from GitHub trending (${opts.since})`,
    "",
    `| Tool | Version | Commands | Flags | Language |`,
    `|------|---------|----------|-------|----------|`,
  ];
  for (const r of results) {
    indexLines.push(
      `| [${r.tool.meta.name}](./${r.tool.meta.name}/SKILL.md) | ${r.tool.meta.version} | ${r.tool.capabilities.commands.length} | ${r.tool.capabilities.globalFlags.length} | ${r.repo.language} |`,
    );
  }
  indexLines.push("");
  writeFileSync(indexPath, indexLines.join("\n"), "utf-8");
  console.log(`\n  📋 Index written to: ${indexPath}`);
}

/** Fallback list of well-known CLI repos for when scraping fails */
function getWellKnownCliRepos(): TrendingRepo[] {
  return [
    { owner: "BurntSushi", repo: "ripgrep", fullName: "BurntSushi/ripgrep", description: "ripgrep recursively searches directories for a regex pattern", language: "Rust", stars: 0, url: "https://github.com/BurntSushi/ripgrep" },
    { owner: "sharkdp", repo: "fd", fullName: "sharkdp/fd", description: "A simple, fast and user-friendly alternative to 'find'", language: "Rust", stars: 0, url: "https://github.com/sharkdp/fd" },
    { owner: "sharkdp", repo: "bat", fullName: "sharkdp/bat", description: "A cat(1) clone with wings", language: "Rust", stars: 0, url: "https://github.com/sharkdp/bat" },
    { owner: "junegunn", repo: "fzf", fullName: "junegunn/fzf", description: "A command-line fuzzy finder", language: "Go", stars: 0, url: "https://github.com/junegunn/fzf" },
    { owner: "jesseduffield", repo: "lazygit", fullName: "jesseduffield/lazygit", description: "simple terminal UI for git commands", language: "Go", stars: 0, url: "https://github.com/jesseduffield/lazygit" },
    { owner: "eza-community", repo: "eza", fullName: "eza-community/eza", description: "A modern replacement for ls", language: "Rust", stars: 0, url: "https://github.com/eza-community/eza" },
    { owner: "ajeetdsouza", repo: "zoxide", fullName: "ajeetdsouza/zoxide", description: "A smarter cd command", language: "Rust", stars: 0, url: "https://github.com/ajeetdsouza/zoxide" },
    { owner: "dandavison", repo: "delta", fullName: "dandavison/delta", description: "A syntax-highlighting pager for git, diff, and grep output", language: "Rust", stars: 0, url: "https://github.com/dandavison/delta" },
    { owner: "astral-sh", repo: "uv", fullName: "astral-sh/uv", description: "An extremely fast Python package and project manager", language: "Rust", stars: 0, url: "https://github.com/astral-sh/uv" },
    { owner: "astral-sh", repo: "ruff", fullName: "astral-sh/ruff", description: "An extremely fast Python linter and code formatter", language: "Rust", stars: 0, url: "https://github.com/astral-sh/ruff" },
    { owner: "biomejs", repo: "biome", fullName: "biomejs/biome", description: "A toolchain for web projects — formatter, linter", language: "Rust", stars: 0, url: "https://github.com/biomejs/biome" },
    { owner: "jqlang", repo: "jq", fullName: "jqlang/jq", description: "Command-line JSON processor", language: "C", stars: 0, url: "https://github.com/jqlang/jq" },
    { owner: "charmbracelet", repo: "glow", fullName: "charmbracelet/glow", description: "Render markdown on the CLI", language: "Go", stars: 0, url: "https://github.com/charmbracelet/glow" },
    { owner: "httpie", repo: "cli", fullName: "httpie/cli", description: "HTTPie CLI — human-friendly HTTP client for the API era", language: "Python", stars: 0, url: "https://github.com/httpie/cli" },
    { owner: "casey", repo: "just", fullName: "casey/just", description: "A command runner / simpler make alternative", language: "Rust", stars: 0, url: "https://github.com/casey/just" },
  ];
}

main().catch((err) => {
  console.error(`\nFatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});

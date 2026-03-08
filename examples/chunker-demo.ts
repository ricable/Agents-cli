#!/usr/bin/env npx tsx
/**
 * chunker-demo.ts
 *
 * Demonstrates the AST-aware semantic chunker on real files.
 * Splits TypeScript/JavaScript at function/class/export boundaries,
 * JSON by key groups, and Markdown by headings.
 *
 * Showcases: lib/chunker (chunkFileAST, chunkJsonFile, chunkMarkdownFile, lineBasedChunk)
 *
 * Usage:
 *   npx tsx examples/chunker-demo.ts                           # chunk this project's lib/
 *   npx tsx examples/chunker-demo.ts ./path/to/file.ts         # chunk a specific file
 *   npx tsx examples/chunker-demo.ts ./path/to/dir             # chunk all files in dir
 *   npx tsx examples/chunker-demo.ts ./package.json --json      # JSON output
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative, resolve } from "node:path";
import { chunkFileAST, chunkJsonFile, chunkMarkdownFile, lineBasedChunk } from "../lib/chunker.js";
import type { AstChunk } from "../lib/chunker.js";

// ── CLI args ──────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const target = args.find(a => !a.startsWith("--")) ?? "lib";
  return {
    target: resolve(target),
    jsonMode: args.includes("--json"),
    verbose: args.includes("--verbose") || args.includes("-v"),
    limit: parseInt(args.find(a => a.startsWith("--limit="))?.split("=")[1] ?? "10", 10),
  };
}

// ── File discovery ────────────────────────────────────────────────────────────
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".jsx", ".json", ".md"]);

function discoverFiles(target: string): string[] {
  try {
    const stat = statSync(target);
    if (!stat.isDirectory()) return [target];
  } catch {
    console.error(`Not found: ${target}`);
    return [];
  }

  const files: string[] = [];
  const walk = (dir: string, depth = 0) => {
    if (depth > 4) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(full);
    }
  };
  walk(target);
  return files;
}

// ── Smart chunk dispatch ──────────────────────────────────────────────────────
function chunkFile(filePath: string, pkg: string): AstChunk[] {
  const ext = extname(filePath).toLowerCase();
  const rel = relative(process.cwd(), filePath);

  if (ext === ".json") {
    try {
      const content = readFileSync(filePath, "utf-8");
      return chunkJsonFile(content, pkg, rel);
    } catch {
      return [];
    }
  }

  if (ext === ".md") {
    try {
      const content = readFileSync(filePath, "utf-8");
      return chunkMarkdownFile(content, pkg, rel);
    } catch {
      return [];
    }
  }

  // TS/JS — use AST-aware chunker
  return chunkFileAST(filePath, pkg, process.cwd());
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const { target, jsonMode, verbose, limit } = parseArgs();
  const files = discoverFiles(target);

  if (files.length === 0) {
    console.error("No files to chunk.");
    process.exitCode = 1;
    return;
  }

  const pkg = "demo";
  const allChunks: AstChunk[] = [];
  const stats = { files: 0, chunks: 0, byType: {} as Record<string, number> };

  for (const file of files) {
    const chunks = chunkFile(file, pkg);
    if (chunks.length === 0) continue;
    allChunks.push(...chunks);
    stats.files++;
    stats.chunks += chunks.length;
    for (const c of chunks) {
      stats.byType[c.chunk_type] = (stats.byType[c.chunk_type] ?? 0) + 1;
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify({
      stats,
      chunks: allChunks.slice(0, limit).map(c => ({
        id: c.id,
        file: c.file,
        type: c.chunk_type,
        tokens: c.tokens,
        sha: c.sha,
        preview: c.content.slice(0, 120).replace(/\n/g, "↵"),
      })),
    }, null, 2));
    return;
  }

  console.log(`\n  AST Chunker Demo\n`);
  console.log(`  Target: ${relative(process.cwd(), target) || "."}`);
  console.log(`  Files:  ${stats.files}`);
  console.log(`  Chunks: ${stats.chunks}`);
  console.log(`  By type:`);
  for (const [type, count] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type.padEnd(12)} ${count}`);
  }

  console.log(`\n  Sample chunks (first ${Math.min(limit, allChunks.length)}):\n`);
  console.log(`  ${"File".padEnd(35)} ${"Type".padEnd(12)} ${"Tokens".padStart(7)} SHA      Preview`);
  console.log(`  ${"─".repeat(100)}`);

  for (const c of allChunks.slice(0, limit)) {
    const preview = c.content.split("\n")[0]?.slice(0, 40) ?? "";
    console.log(
      `  ${c.file.slice(0, 35).padEnd(35)} ${c.chunk_type.padEnd(12)} ${String(c.tokens).padStart(7)} ${c.sha}  ${preview}`
    );
    if (verbose) {
      console.log(`    ${c.content.slice(0, 200).replace(/\n/g, "\n    ")}\n`);
    }
  }
  console.log();
}

main();

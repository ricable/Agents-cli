/**
 * chunker: AST-aware file chunking, deduplication, and metadata extraction.
 *
 * Merged from core/src/preprocessing/{ast-chunker, deduplicator, metadata-extractor}.
 *
 * - chunkFileAST: Splits TS/JS files at semantic boundaries (functions, classes, exports);
 *   falls back to line-based chunking for other file types.
 * - chunkJsonFile / chunkMarkdownFile: Structure-aware chunking for JSON and Markdown.
 * - shouldSkipFile / filterChunks: Deduplication and generated-file filtering.
 * - extractMetadataChunks: Extracts JSDoc, type signatures, and export lists.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { extname, relative } from "node:path";

// ── Types ────────────────────────────────────────────────────────────────

export interface AstChunk {
  id: string;
  pkg: string;
  file: string;
  chunk_index: number;
  content: string;
  tokens: number;
  sha: string;
  chunk_type: "function" | "class" | "export" | "block" | "line-based";
}

export interface ChunkLike {
  id: string;
  pkg: string;
  file: string;
  content: string;
  sha: string;
}

export interface MetadataChunk {
  id: string;
  pkg: string;
  file: string;
  chunk_index: number;
  content: string;
  tokens: number;
  sha: string;
  meta_type: "jsdoc" | "signature" | "export-list";
}

// ── Constants ────────────────────────────────────────────────────────────

const TS_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".jsx"]);
const TS_META_EXTENSIONS = new Set([".ts", ".tsx", ".d.ts"]);
const LINE_CHUNK_SIZE = 120;
const LINE_OVERLAP = 10;
const MIN_CHUNK_CHARS = 50;
const JSON_DEPS_BATCH_SIZE = 20;
const MD_PREAMBLE_THRESHOLD = 200;
const MD_MAX_CHUNK_CHARS = 2000;
const MIN_META_CHARS = 30;

export const SKIP_PATTERNS: RegExp[] = [
  /\.d\.ts$/,
  /[/\\]dist[/\\]/,
  /[/\\]build[/\\]/,
  /[/\\]\.next[/\\]/,
  /[/\\]\.cache[/\\]/,
  /\.min\.js$/,
  /-lock\.json$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
];

const MIN_CONTENT_LENGTH = 50;

// ── AST chunking ─────────────────────────────────────────────────────────

function makeChunk(
  content: string,
  pkg: string,
  relFile: string,
  idx: number,
  type: AstChunk["chunk_type"],
): AstChunk | null {
  const trimmed = content.trim();
  if (trimmed.length < MIN_CHUNK_CHARS) return null;
  const sha = createHash("sha1").update(trimmed).digest("hex").slice(0, 8);
  const id = `${pkg}::${relFile}::${idx}`;
  return {
    id,
    pkg,
    file: relFile,
    chunk_index: idx,
    content: trimmed,
    tokens: Math.ceil(trimmed.length / 4),
    sha,
    chunk_type: type,
  };
}

/**
 * Attempt AST-based chunking using heuristic top-level declaration splitting.
 * Returns empty array if the file has no discernible structure.
 */
function tryAstChunk(source: string, pkg: string, relFile: string): AstChunk[] {
  const lines = source.split("\n");
  const chunks: AstChunk[] = [];
  let current: string[] = [];
  let currentType: AstChunk["chunk_type"] = "block";
  let chunkIdx = 0;

  const isTopLevelDecl = (line: string): boolean => {
    if (/^\/\*\*/.test(line)) return true;
    if (/^(export\s+)?(async\s+)?function\s/.test(line)) return true;
    if (/^(export\s+)?class\s/.test(line)) return true;
    if (/^(export\s+)?interface\s/.test(line)) return true;
    if (/^(export\s+)?type\s+\w/.test(line)) return true;
    if (/^export\s+(const|let|var)\s/.test(line)) return true;
    if (/^export\s+\{/.test(line)) return true;
    if (/^export\s+default\s/.test(line)) return true;
    return false;
  };

  const getChunkType = (line: string): AstChunk["chunk_type"] => {
    if (/function/.test(line)) return "function";
    if (/class/.test(line)) return "class";
    if (/export/.test(line)) return "export";
    return "block";
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (isTopLevelDecl(line) && current.length > 0) {
      const chunk = makeChunk(current.join("\n"), pkg, relFile, chunkIdx, currentType);
      if (chunk) {
        chunks.push(chunk);
        chunkIdx++;
      }
      current = [];
    }

    if (isTopLevelDecl(line)) {
      currentType = getChunkType(line);
    }
    current.push(line);

    if (current.length >= 200) {
      const chunk = makeChunk(current.join("\n"), pkg, relFile, chunkIdx, currentType);
      if (chunk) {
        chunks.push(chunk);
        chunkIdx++;
      }
      current = [];
    }
  }

  if (current.length > 0) {
    const chunk = makeChunk(current.join("\n"), pkg, relFile, chunkIdx, currentType);
    if (chunk) chunks.push(chunk);
  }

  // If only 1 chunk for a large file, fall back to line-based
  if (chunks.length <= 1 && lines.length > LINE_CHUNK_SIZE) {
    return [];
  }

  return chunks;
}

/**
 * Chunk a file using AST boundaries for TS/JS, line-based for others.
 */
export function chunkFileAST(filePath: string, pkg: string, relBase?: string): AstChunk[] {
  const ext = extname(filePath).toLowerCase();
  const relFile = relBase ? relative(relBase, filePath) : filePath;

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  if (raw.length === 0) return [];

  if (TS_EXTENSIONS.has(ext)) {
    const chunks = tryAstChunk(raw, pkg, relFile);
    if (chunks.length > 0) return chunks;
  }

  return lineBasedChunk(raw, pkg, relFile);
}

/**
 * Line-based chunking with configurable overlap.
 */
export function lineBasedChunk(source: string, pkg: string, relFile: string): AstChunk[] {
  const lines = source.split("\n");
  const chunks: AstChunk[] = [];
  let chunkIdx = 0;

  for (let i = 0; i < lines.length; i += LINE_CHUNK_SIZE - LINE_OVERLAP) {
    const slice = lines.slice(i, i + LINE_CHUNK_SIZE).join("\n");
    const chunk = makeChunk(slice, pkg, relFile, chunkIdx, "line-based");
    if (chunk) {
      chunks.push(chunk);
      chunkIdx++;
    }
    if (i + LINE_CHUNK_SIZE >= lines.length) break;
  }

  return chunks;
}

// ── JSON schema-aware chunking ───────────────────────────────────────────

/**
 * Chunk a JSON file by top-level key groups.
 * Handles package.json structure: meta, deps, devDeps, scripts, exports.
 * Falls back to line-based for invalid JSON.
 */
export function chunkJsonFile(content: string, pkg: string, relFile: string): AstChunk[] {
  if (!content.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return lineBasedChunk(content, pkg, relFile);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return lineBasedChunk(content, pkg, relFile);
  }
  const obj = parsed as Record<string, unknown>;

  const chunks: AstChunk[] = [];
  let idx = 0;

  const addChunk = (keyGroup: string, data: Record<string, unknown>): void => {
    const text = JSON.stringify(data, null, 2);
    if (text.length < MIN_CHUNK_CHARS) return;
    const sha = createHash("sha1").update(text).digest("hex").slice(0, 8);
    chunks.push({
      id: `${pkg}::${relFile}::json-${keyGroup}-${idx}`,
      pkg,
      file: relFile,
      chunk_index: idx++,
      content: text,
      tokens: Math.ceil(text.length / 4),
      sha,
      chunk_type: "block",
    });
  };

  // Chunk 1: metadata fields
  const META_KEYS = ["name", "version", "description", "keywords", "license", "author", "homepage", "repository", "engines"];
  const meta: Record<string, unknown> = {};
  for (const k of META_KEYS) {
    if (k in obj) meta[k] = obj[k];
  }
  if (Object.keys(meta).length > 0) addChunk("meta", meta);

  // Dependencies (batched)
  const deps = (obj["dependencies"] ?? {}) as Record<string, string>;
  const depEntries = Object.entries(deps);
  for (let i = 0; i < depEntries.length; i += JSON_DEPS_BATCH_SIZE) {
    addChunk(`deps-${Math.floor(i / JSON_DEPS_BATCH_SIZE)}`, {
      dependencies: Object.fromEntries(depEntries.slice(i, i + JSON_DEPS_BATCH_SIZE)),
    });
  }

  // devDependencies (batched)
  const devDeps = (obj["devDependencies"] ?? {}) as Record<string, string>;
  const devEntries = Object.entries(devDeps);
  for (let i = 0; i < devEntries.length; i += JSON_DEPS_BATCH_SIZE) {
    addChunk(`devdeps-${Math.floor(i / JSON_DEPS_BATCH_SIZE)}`, {
      devDependencies: Object.fromEntries(devEntries.slice(i, i + JSON_DEPS_BATCH_SIZE)),
    });
  }

  // scripts
  if (obj["scripts"] && Object.keys(obj["scripts"] as object).length > 0) {
    addChunk("scripts", { scripts: obj["scripts"] });
  }

  // exports / main / types / bin
  const EXP_KEYS = ["exports", "main", "types", "module", "bin", "files"];
  const exp: Record<string, unknown> = {};
  for (const k of EXP_KEYS) {
    if (k in obj) exp[k] = obj[k];
  }
  if (Object.keys(exp).length > 0) addChunk("exports", exp);

  return chunks.length > 0 ? chunks : lineBasedChunk(content, pkg, relFile);
}

// ── Markdown section-based chunking ──────────────────────────────────────

/**
 * Split markdown by # and ## headings into semantic chunks.
 * Merges sections < 200 chars with the next section.
 * Caps each chunk at 2000 chars.
 */
export function chunkMarkdownFile(content: string, pkg: string, relFile: string): AstChunk[] {
  if (!content.trim()) return [];

  const lines = content.split("\n");
  const rawSections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^#{1,2} /.test(line) && current.length > 0) {
      rawSections.push(current.join("\n"));
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) rawSections.push(current.join("\n"));

  // Merge preamble with the next heading section
  const merged: string[] = [];
  for (let i = 0; i < rawSections.length; i++) {
    const section = rawSections[i]!.trim();
    if (!section) continue;
    const hasHeading = /^#{1,2} /.test(section);
    if (!hasHeading && section.length < MD_PREAMBLE_THRESHOLD && i + 1 < rawSections.length) {
      rawSections[i + 1] = section + "\n\n" + rawSections[i + 1]!;
    } else {
      merged.push(section);
    }
  }

  const chunks: AstChunk[] = [];
  let chunkIdx = 0;
  for (let i = 0; i < merged.length; i++) {
    const text = merged[i]!.slice(0, MD_MAX_CHUNK_CHARS).trim();
    if (text.length < MIN_CHUNK_CHARS) continue;
    const sha = createHash("sha1").update(text).digest("hex").slice(0, 8);
    chunks.push({
      id: `${pkg}::${relFile}::md-${chunkIdx}`,
      pkg,
      file: relFile,
      chunk_index: chunkIdx++,
      content: text,
      tokens: Math.ceil(text.length / 4),
      sha,
      chunk_type: "block",
    });
  }

  return chunks.length > 0 ? chunks : lineBasedChunk(content, pkg, relFile);
}

// ── Deduplication ────────────────────────────────────────────────────────

/**
 * Returns true if the file path matches a generated/build file pattern
 * and should be skipped entirely.
 */
export function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(filePath));
}

/**
 * Filter chunks before writing to storage.
 *
 * Removes chunks that are:
 *   - Too short (< 50 chars)
 *   - From generated/build files
 *   - Exact SHA duplicates (already present in existingShas)
 *
 * @param chunks       Candidate chunks to filter
 * @param existingShas Set of SHA strings already stored for this package
 * @returns            Chunks that should be written
 */
export function filterChunks<T extends ChunkLike>(chunks: T[], existingShas: Set<string>): T[] {
  if (chunks.length === 0) return [];

  return chunks.filter((chunk) => {
    if (chunk.content.trim().length < MIN_CONTENT_LENGTH) return false;
    if (shouldSkipFile(chunk.file)) return false;
    if (existingShas.has(chunk.sha)) return false;
    return true;
  });
}

// ── Metadata extraction ──────────────────────────────────────────────────

function makeMetaChunk(
  content: string,
  pkg: string,
  relFile: string,
  idx: number,
  type: MetadataChunk["meta_type"],
): MetadataChunk | null {
  const t = content.trim();
  if (t.length < MIN_META_CHARS) return null;
  const sha = createHash("sha1").update(t).digest("hex").slice(0, 8);
  return {
    id: `${pkg}::meta::${relFile}::${idx}`,
    pkg,
    file: relFile,
    chunk_index: idx,
    content: t,
    tokens: Math.ceil(t.length / 4),
    sha,
    meta_type: type,
  };
}

/**
 * Extract high-priority metadata chunks from a TypeScript/JavaScript file.
 * Targets JSDoc blocks, function signatures, and export lists.
 */
export function extractMetadataChunks(filePath: string, pkg: string, relBase?: string): MetadataChunk[] {
  const ext = extname(filePath).toLowerCase();
  if (!TS_META_EXTENSIONS.has(ext)) return [];

  let source: string;
  try {
    source = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const relFile = relBase ? relative(relBase, filePath) : filePath;
  const chunks: MetadataChunk[] = [];
  let idx = 0;

  // Extract JSDoc blocks
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
  let match: RegExpExecArray | null;
  while ((match = jsdocRegex.exec(source)) !== null) {
    const chunk = makeMetaChunk(match[0], pkg, relFile, idx++, "jsdoc");
    if (chunk) chunks.push(chunk);
  }

  // Extract function/method signatures (up to opening brace or semicolon)
  const signatureRegex = /^(export\s+)?(async\s+)?function\s+\w+[^{;]*[{;]/gm;
  while ((match = signatureRegex.exec(source)) !== null) {
    const sig = match[0].replace(/\{$/, "").trim();
    const chunk = makeMetaChunk(sig, pkg, relFile, idx++, "signature");
    if (chunk) chunks.push(chunk);
  }

  // Extract export { ... } lists
  const exportListRegex = /export\s*\{[^}]+\}/g;
  while ((match = exportListRegex.exec(source)) !== null) {
    const chunk = makeMetaChunk(match[0], pkg, relFile, idx++, "export-list");
    if (chunk) chunks.push(chunk);
  }

  return chunks;
}

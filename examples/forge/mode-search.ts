/**
 * forge/mode-search.ts — Search indexed skills via FTS/hybrid/vector.
 * (Gap 2: --search mode)
 */

import { success, emit } from "../../lib/output.js";
import type { CliArgs } from "./types.js";
import { log, fmtTable } from "./helpers.js";

export async function searchMode(args: CliArgs, startTime: number): Promise<void> {
  const { hybridSearch } = await import("../../lib/search.js");

  log(`  Mode:        search`);
  log(`  Query:       "${args.search}"`);
  log(`  Search mode: ${args.searchMode}`);
  if (args.pkg) log(`  Package:     ${args.pkg}`);
  log(`  Limit:       ${args.limit}`);
  log("");

  try {
    const results = await hybridSearch({
      query: args.search,
      pkg: args.pkg || undefined,
      limit: args.limit,
      mode: args.searchMode,
    });

    if (results.length === 0) {
      log("  No results found. Try a different query or rebuild the index with --index.");
      if (args.json) {
        emit(success("skill-forge:search", { query: args.search, results: [] }, startTime), true);
      }
      return;
    }

    const rows = results.map(r => [
      r.pkg.slice(0, 20),
      r.file.slice(0, 30),
      r.score != null ? r.score.toFixed(3) : "—",
      r.snippet.slice(0, 60).replace(/\n/g, " "),
    ]);
    log(fmtTable(rows, ["Package", "File", "Score", "Snippet"]));
    log(`\n  ${results.length} result(s)`);

    if (args.json) {
      emit(success("skill-forge:search", {
        query: args.search,
        mode: args.searchMode,
        results: results.map(r => ({
          pkg: r.pkg,
          file: r.file,
          chunkIndex: r.chunkIndex,
          tokens: r.tokens,
          score: r.score,
          snippet: r.snippet,
        })),
      }, startTime), true);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`  Search failed: ${msg}`);
    log("  Make sure agentdb.sqlite exists. Run --index to build it.");
    if (args.json) {
      emit(success("skill-forge:search", { query: args.search, error: msg, results: [] }, startTime), true);
    }
  }
}

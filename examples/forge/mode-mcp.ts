/**
 * forge/mode-mcp.ts — Start MCP server exposing forged skills.
 * (Gap 7: --mcp mode)
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { success, emit } from "../../lib/output.js";
import { McpBridge, createMcpConfig } from "../../lib/mcp.js";
import type { CliArgs } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log } from "./helpers.js";

export async function mcpMode(args: CliArgs, startTime: number): Promise<void> {
  log(`  Mode:   mcp`);
  log(`  Source: ${OUTPUT_DIR}`);
  log("");

  if (!existsSync(OUTPUT_DIR)) {
    log("  Output directory not found. Generate skills first.");
    process.exitCode = 1;
    return;
  }

  // Collect tool directories
  const toolDirs: string[] = [];
  for (const dir of readdirSync(OUTPUT_DIR)) {
    if (dir.startsWith("_") || dir.startsWith(".")) continue;
    const full = join(OUTPUT_DIR, dir);
    if (existsSync(join(full, "SKILL.md"))) {
      toolDirs.push(full);
    }
  }

  if (toolDirs.length === 0) {
    log("  No skills found to expose.");
    return;
  }

  log(`  Exposing ${toolDirs.length} skills via MCP`);

  if (args.dryRun) {
    log(`\n  Dry run complete. Would start MCP server with ${toolDirs.length} tools.`);
    if (args.json) {
      emit(success("skill-forge:mcp", { tools: toolDirs.length, dryRun: true }, startTime), true);
    }
    return;
  }

  const config = createMcpConfig(toolDirs);
  const bridge = new McpBridge();

  try {
    bridge.startServer(config);
    log(`  MCP server started (${toolDirs.length} tools)`);
    log("  Press Ctrl+C to stop\n");

    // List available tools
    try {
      const tools = await bridge.listTools();
      for (const tool of tools) {
        log(`    ${tool.name}: ${tool.description}`);
      }
    } catch {
      log("  (tool listing not available — server may still be initializing)");
    }

    // Keep running until interrupted
    await new Promise<void>((resolve) => {
      const handler = () => {
        bridge.stopServer();
        log("\n  MCP server stopped.");
        resolve();
      };
      process.on("SIGINT", handler);
      process.on("SIGTERM", handler);
    });
  } catch (err) {
    log(`  MCP server failed: ${(err as Error).message}`);
    bridge.stopServer();
    process.exitCode = 1;
  }

  if (args.json) {
    emit(success("skill-forge:mcp", { tools: toolDirs.length }, startTime), true);
  }
}

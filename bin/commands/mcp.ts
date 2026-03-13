import { Command } from "commander";
import { join } from "node:path";
import { createStore } from "../../lib/store.js";
import { McpBridge, createMcpConfig } from "../../lib/mcp.js";
import { success, emit } from "../../lib/output.js";
import { DATA_DIR, isJsonMode } from "./shared.js";

export function registerMcpCommand(program: Command): void {
  const mcp = program.command("mcp").description("MCP server management");

  mcp
    .command("start")
    .description("Start the MCP server with all installed tool directories")
    .option("--json", "Output as structured JSON")
    .action(async (opts: { json?: boolean }) => {
      const json = isJsonMode(opts);
      const store = createStore(DATA_DIR);
      const result = await store.list();
      const toolDirs = result.tools.map((t) => join(DATA_DIR, "tools", t.id));

      const config = createMcpConfig(toolDirs);
      const bridge = new McpBridge();
      bridge.startServer(config);

      if (json) {
        console.log(JSON.stringify({ ok: true, command: "mcp start", tools: toolDirs.length }));
      } else {
        console.log(`MCP server started with ${toolDirs.length} tool directories`);
        console.log("Press Ctrl+C to stop.");
      }

      await new Promise<void>((res) => {
        process.on("SIGINT", () => { bridge.stopServer(); res(); });
        process.on("SIGTERM", () => { bridge.stopServer(); res(); });
      });
    });

  mcp
    .command("list")
    .description("List tools available through MCP")
    .option("--json", "Output as structured JSON")
    .action(async (opts: { json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);
      const store = createStore(DATA_DIR);
      const result = await store.list();
      const toolDirs = result.tools.map((t) => join(DATA_DIR, "tools", t.id));

      const config = createMcpConfig(toolDirs);
      const bridge = new McpBridge();
      bridge.startServer(config);

      try {
        const tools = await bridge.listTools();
        if (json) {
          emit(success("mcp list", { tools }, start), true);
        } else {
          console.log(`\n  MCP tools (${tools.length}):\n`);
          for (const tool of tools) {
            console.log(`  ${tool.name}`);
            if (tool.description) console.log(`    ${tool.description}`);
          }
        }
      } finally {
        bridge.stopServer();
      }
    });
}

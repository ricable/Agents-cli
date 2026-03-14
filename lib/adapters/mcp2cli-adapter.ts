/**
 * MCP-to-CLI adapter: shells out to mcp2cli to convert MCP servers into Tools.
 *
 * Handles sources with "mcp:" prefix (e.g., "mcp:filesystem").
 * Uses mcp2cli to introspect the MCP server and produce a Tool.
 */

import type { SourceAdapter, SkillCandidate, AdapterOptions, MCPServerConfig } from "./types.js";
import { shellQuote } from "../guards.js";
import { toErrorMessage } from "../output.js";
import { execSync } from "node:child_process";

export class Mcp2cliAdapter implements SourceAdapter {
  readonly type = "mcp2cli" as const;

  supports(source: string): boolean {
    return source.startsWith("mcp:");
  }

  async analyze(source: string, opts?: AdapterOptions): Promise<SkillCandidate> {
    const serverName = source.replace(/^mcp:/, "").trim();
    if (!serverName) {
      return {
        source,
        adapter: "mcp2cli",
        meta: { name: source, description: "Empty MCP server name" },
      };
    }

    try {
      // Build MCP server config from source name
      const config = this.buildConfig(serverName);
      const timeout = opts?.timeout ?? 30_000;

      // Shell out to mcp2cli for introspection
      const args = [config.command, ...config.args].map(shellQuote).join(" ");
      const envStr = config.env
        ? Object.entries(config.env).map(([k, v]) => `${shellQuote(k)}=${shellQuote(v)}`).join(" ")
        : "";

      const cmd = envStr
        ? `${envStr} npx mcp2cli introspect -- ${args}`
        : `npx mcp2cli introspect -- ${args}`;

      const stdout = execSync(cmd, {
        timeout,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Parse mcp2cli JSON output into a Tool-like structure
      const parsed = JSON.parse(stdout);
      const commands = (parsed.tools ?? []).map((t: { name: string; description?: string }) => ({
        name: t.name,
        description: t.description ?? "",
        flags: [],
      }));

      const tool = {
        id: `mcp-${serverName}`,
        meta: {
          name: config.name,
          version: parsed.version ?? "1.0.0",
          description: parsed.description ?? `MCP server: ${serverName}`,
          tags: ["mcp", "mcp-server"],
        },
        source: { format: "mcp" as const, uri: source },
        capabilities: { commands, globalFlags: [], subcommandAliases: {} },
        installPath: opts?.dataDir ?? "",
        status: "installed" as const,
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        source,
        adapter: "mcp2cli",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tool: tool as any,
        mcpConfig: config,
        pruneAfter: false,
      };
    } catch (err) {
      return {
        source,
        adapter: "mcp2cli",
        meta: { name: serverName, description: toErrorMessage(err) },
      };
    }
  }

  /** Build an MCPServerConfig from a server name. */
  private buildConfig(name: string): MCPServerConfig {
    // Convention: npm-based MCP servers use "npx -y @modelcontextprotocol/server-<name>"
    const npmPackage = `@modelcontextprotocol/server-${name}`;
    return {
      name,
      command: "npx",
      args: ["-y", npmPackage],
      npmPackage,
    };
  }
}

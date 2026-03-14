/**
 * MCP-to-CLI adapter: shells out to mcp2cli to convert MCP servers into Tools.
 *
 * Handles sources with "mcp:" prefix (e.g., "mcp:filesystem").
 * Uses mcp2cli to introspect the MCP server and produce a Tool.
 */

import type { SourceAdapter, SkillCandidate, AdapterOptions, MCPServerConfig } from "./types.js";
import { extractAdapterName, errorCandidate, buildCandidateTool } from "./types.js";
import { shellQuote } from "../guards.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Validate env var key is a valid POSIX identifier (no quoting needed). */
const VALID_ENV_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

export class Mcp2cliAdapter implements SourceAdapter {
  readonly type = "mcp2cli" as const;

  supports(source: string): boolean {
    return source.startsWith("mcp:");
  }

  async analyze(source: string, opts?: AdapterOptions): Promise<SkillCandidate> {
    const serverName = extractAdapterName(source, "mcp:");
    if (!serverName) {
      return { source, adapter: this.type, meta: { name: source, description: "Empty MCP server name" } };
    }

    try {
      const config = this.buildConfig(serverName);
      const timeout = opts?.timeout ?? 30_000;

      // Build env for child process (safer than shell env prefix)
      const childEnv: Record<string, string> = { ...process.env };
      if (config.env) {
        for (const [k, v] of Object.entries(config.env)) {
          if (!VALID_ENV_KEY.test(k)) throw new Error(`Invalid env var key: ${k}`);
          childEnv[k] = v;
        }
      }

      const { stdout } = await execFileAsync(
        "npx", ["mcp2cli", "introspect", "--", config.command, ...config.args],
        { timeout, encoding: "utf-8", env: childEnv },
      );

      const parsed = JSON.parse(stdout);
      const commands = (parsed.tools ?? []).map((t: { name: string; description?: string }) => ({
        name: t.name, description: t.description ?? "", flags: [],
      }));

      const tool = buildCandidateTool({
        id: `mcp-${serverName}`,
        name: config.name,
        version: parsed.version,
        description: parsed.description ?? `MCP server: ${serverName}`,
        tags: ["mcp", "mcp-server"],
        format: "mcp",
        uri: source,
        commands,
        installPath: opts?.dataDir ?? "",
      });

      return { source, adapter: this.type, tool, mcpConfig: config, pruneAfter: false };
    } catch (err) {
      return errorCandidate(source, this.type, serverName, err);
    }
  }

  /** Build an MCPServerConfig from a server name. */
  private buildConfig(name: string): MCPServerConfig {
    const npmPackage = `@modelcontextprotocol/server-${name}`;
    return { name, command: "npx", args: ["-y", npmPackage], npmPackage };
  }
}

import { spawn, type ChildProcess } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { McpServerConfig, AgentRunResult } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** JSON-RPC 2.0 request */
interface JsonRpcRequest {
  readonly jsonrpc: "2.0";
  readonly id: number;
  readonly method: string;
  readonly params?: Record<string, unknown>;
}

/** JSON-RPC 2.0 response */
interface JsonRpcResponse {
  readonly jsonrpc: "2.0";
  readonly id: number;
  readonly result?: unknown;
  readonly error?: { code: number; message: string; data?: unknown };
}

/** Tool description returned by tools/list */
export interface McpToolDescription {
  readonly name: string;
  readonly description: string;
  readonly inputSchema?: Record<string, unknown>;
}

/**
 * MCP Bridge - manages the MCP stdio server process.
 *
 * Communicates with a Python registry.py process over stdin/stdout
 * using JSON-RPC 2.0 protocol.
 */
export class McpBridge {
  private process: ChildProcess | null = null;
  private nextId = 1;
  private pending = new Map<number, {
    resolve: (value: JsonRpcResponse) => void;
    reject: (reason: Error) => void;
  }>();
  private buffer = "";
  private _started = false;

  get started(): boolean {
    return this._started;
  }

  /**
   * Start the MCP server process.
   */
  startServer(config: McpServerConfig): void {
    if (this.process) {
      throw new Error("Server already running");
    }

    const toolPath = config.toolDirs.join(":");

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      AGENT_TOOLS_PATH: toolPath,
      ...(config.env ?? {}),
    };

    this.process = spawn(config.command, [...config.args], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.process.stdout!.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString();
      this.processBuffer();
    });

    this.process.on("error", (err: Error) => {
      // Reject all pending requests
      for (const [, handler] of this.pending) {
        handler.reject(err);
      }
      this.pending.clear();
    });

    this.process.on("close", () => {
      this._started = false;
      // Reject all pending requests
      for (const [, handler] of this.pending) {
        handler.reject(new Error("Server process exited"));
      }
      this.pending.clear();
      this.process = null;
    });

    this._started = true;
  }

  private static readonly KILL_TIMEOUT = 5_000; // 5 seconds before SIGKILL

  /**
   * Stop the MCP server process.
   */
  stopServer(): void {
    if (this.process) {
      const proc = this.process;
      proc.kill("SIGTERM");

      // SIGKILL fallback if process doesn't exit within timeout
      const killTimer = setTimeout(() => {
        try { proc.kill("SIGKILL"); } catch { /* already dead */ }
      }, McpBridge.KILL_TIMEOUT);
      killTimer.unref(); // Don't block Node.js exit

      this.process = null;
      this._started = false;
      this.buffer = "";
      // Reject pending requests
      for (const [, handler] of this.pending) {
        handler.reject(new Error("Server stopped"));
      }
      this.pending.clear();
    }
  }

  /**
   * List available tools from the MCP server.
   */
  async listTools(): Promise<McpToolDescription[]> {
    const response = await this.sendRequest("tools/list", {});
    if (response.error) {
      throw new Error(`MCP error: ${response.error.message}`);
    }
    const result = response.result as { tools?: McpToolDescription[] } | undefined;
    return result?.tools ?? [];
  }

  /**
   * Call a tool via the MCP server.
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<AgentRunResult> {
    const start = Date.now();
    try {
      const response = await this.sendRequest("tools/call", { name, arguments: args });
      const duration = Date.now() - start;

      if (response.error) {
        return {
          success: false,
          error: {
            code: "MCP_ERROR",
            message: response.error.message,
            details: { rpcCode: response.error.code },
          },
          duration,
        };
      }

      return {
        success: true,
        data: response.result,
        duration,
      };
    } catch (err) {
      const duration = Date.now() - start;
      return {
        success: false,
        error: {
          code: "MCP_CALL_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
        duration,
      };
    }
  }

  private static readonly REQUEST_TIMEOUT = 30_000; // 30 seconds

  /**
   * Send a JSON-RPC request and wait for the response.
   */
  private sendRequest(method: string, params: Record<string, unknown>): Promise<JsonRpcResponse> {
    if (!this.process?.stdin) {
      return Promise.reject(new Error("Server not running"));
    }

    const id = this.nextId++;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise<JsonRpcResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timed out after ${McpBridge.REQUEST_TIMEOUT}ms: ${method}`));
      }, McpBridge.REQUEST_TIMEOUT);

      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (reason) => { clearTimeout(timer); reject(reason); },
      });

      const data = JSON.stringify(request) + "\n";
      this.process!.stdin!.write(data, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  /**
   * Process the stdout buffer for complete JSON-RPC messages.
   * Messages are newline-delimited JSON.
   */
  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    // Keep the last (possibly incomplete) line in the buffer
    this.buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const response = JSON.parse(trimmed) as JsonRpcResponse;
        const handler = this.pending.get(response.id);
        if (handler) {
          this.pending.delete(response.id);
          handler.resolve(response);
        }
      } catch {
        // Ignore non-JSON lines (e.g., debug output)
      }
    }
  }
}

/**
 * Create a default McpServerConfig for the Python registry.
 */
export function createMcpConfig(toolDirs: readonly string[]): McpServerConfig {
  const registryPath = join(__dirname, "..", "python", "registry.py");
  return {
    command: "python3",
    args: [registryPath],
    toolDirs: [...toolDirs],
  };
}

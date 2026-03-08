import { spawn } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { createStore } from "../lib/store.js";
import { findMainBinary } from "../lib/analyzer.js";
import { homedir } from "node:os";
import type { AgentRunResult } from "../lib/types.js";

const DATA_DIR = join(homedir(), ".agents-cli");
const DEFAULT_TIMEOUT = 30_000;

interface RunOptions {
  readonly toolName: string;
  readonly args: readonly string[];
  readonly json: boolean;
  readonly timeout: number;
}

function parseArgs(argv: string[]): RunOptions {
  const rawArgs = argv.slice(2);
  let json = false;
  let timeout = DEFAULT_TIMEOUT;
  const filtered: string[] = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i]!;
    if (arg === "--json") {
      json = true;
    } else if (arg === "--timeout") {
      const next = rawArgs[i + 1];
      if (next !== undefined) {
        timeout = parseInt(next, 10);
        i++;
      }
    } else {
      filtered.push(arg);
    }
  }

  const toolName = filtered[0] ?? "";
  const toolArgs = filtered.slice(1);

  return { toolName, args: toolArgs, json, timeout };
}

function formatOutput<T>(result: AgentRunResult<T>, json: boolean): string {
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.success) {
    return typeof result.data === "string" ? result.data : JSON.stringify(result.data);
  }
  return `Error [${result.error?.code ?? "UNKNOWN"}]: ${result.error?.message ?? "Unknown error"}`;
}

export async function runTool(
  toolName: string,
  args: readonly string[],
  options: { timeout?: number; dataDir?: string } = {},
): Promise<AgentRunResult<string>> {
  const dataDir = options.dataDir ?? DATA_DIR;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const store = createStore(dataDir);

  const tool = await store.get(toolName);
  if (!tool) {
    return {
      success: false,
      error: { code: "TOOL_NOT_FOUND", message: `Tool not found: ${toolName}` },
      duration: 0,
    };
  }

  const installDir = tool.installPath;
  if (!existsSync(installDir)) {
    return {
      success: false,
      error: { code: "TOOL_NOT_INSTALLED", message: `Tool directory not found: ${installDir}` },
      duration: 0,
    };
  }

  // Find executable using the shared analyzer logic (supports monorepos)
  const binPath = findMainBinary(installDir);
  if (!binPath) {
    return {
      success: false,
      error: { code: "NO_BINARY", message: `No executable found in: ${installDir}` },
      duration: 0,
    };
  }

  const start = Date.now();

  return new Promise<AgentRunResult<string>>((resolve) => {
    const env = {
      ...process.env,
      AGENT_TOOLS_PATH: installDir,
    };

    const child = spawn(binPath!, [...args], {
      env,
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    const MAX_OUTPUT = 10 * 1024 * 1024; // 10MB cap
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT) stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT) stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      // SIGKILL fallback after 5 seconds
      const killTimer = setTimeout(() => {
        try { child.kill("SIGKILL"); } catch { /* already dead */ }
      }, 5000);
      killTimer.unref();
      const duration = Date.now() - start;
      resolve({
        success: false,
        error: { code: "TIMEOUT", message: `Tool timed out after ${timeout}ms`, details: { timeout } },
        duration,
      });
    }, timeout);

    child.on("error", (err: Error) => {
      clearTimeout(timer);
      const duration = Date.now() - start;
      resolve({
        success: false,
        error: { code: "SPAWN_ERROR", message: err.message },
        duration,
      });
    });

    child.on("close", (code: number | null) => {
      clearTimeout(timer);
      const duration = Date.now() - start;
      if (code === 0) {
        resolve({ success: true, data: stdout.trim(), duration });
      } else {
        resolve({
          success: false,
          error: {
            code: "EXIT_ERROR",
            message: stderr.trim() || `Process exited with code ${code}`,
            details: { exitCode: code },
          },
          duration,
        });
      }
    });
  });
}

// CLI entry point — only runs when invoked directly
const isDirectRun = process.argv[1]?.includes("agent-run");
if (isDirectRun) {
  const opts = parseArgs(process.argv);

  if (!opts.toolName) {
    console.error("Usage: agent-run <tool-name> [args...] [--json] [--timeout <ms>]");
    process.exitCode = 1;
  } else {
    runTool(opts.toolName, opts.args, { timeout: opts.timeout })
      .then((result) => {
        console.log(formatOutput(result, opts.json));
        if (!result.success) {
          process.exitCode = 1;
        }
      })
      .catch((err: unknown) => {
        console.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
        process.exitCode = 1;
      });
  }
}

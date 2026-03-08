/**
 * Structured output layer — gws-style JSON envelope on every command.
 *
 * Every CLI command wraps its result in CliOutput<T>. When --json is passed,
 * the envelope is printed as JSON. Otherwise, commands print human-readable text
 * and only use this for error handling.
 *
 * This is the core of the "agent-first" design: AI agents always get machine-readable
 * structured data, never have to parse human text.
 */

import type { CliOutput } from "./types.js";

const VERSION = "0.1.0";

/** Wrap a successful result in the standard envelope */
export function success<T>(command: string, data: T, startTime: number): CliOutput<T> {
  return {
    ok: true,
    command,
    data,
    meta: {
      version: VERSION,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    },
  };
}

/** Wrap an error in the standard envelope */
export function failure(
  command: string,
  code: string,
  message: string,
  startTime: number,
  details?: Record<string, unknown>,
): CliOutput<never> {
  return {
    ok: false,
    command,
    error: { code, message, details },
    meta: {
      version: VERSION,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    },
  };
}

/** Emit a CliOutput — JSON when --json, human error otherwise */
export function emit<T>(result: CliOutput<T>, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } else if (!result.ok) {
    console.error(`Error [${result.error?.code}]: ${result.error?.message}`);
    process.exitCode = 1;
  }
  // When json=false and ok=true, the command handles its own human output
}

/**
 * mcp-skill: wraps opensrc-mcp operations for use inside
 * Claude Code agent loops and agentic-flow pipelines.
 *
 * Exposes: fetch | tree | grep | astGrep | read | readMany | search
 */

export type OpensrcOp =
  | { op: "fetch"; source: string }
  | { op: "tree"; source: string; depth?: number }
  | { op: "grep"; pattern: string; sources?: string[]; include?: string }
  | { op: "astGrep"; source: string; pattern: string }
  | { op: "read"; source: string; file: string }
  | { op: "readMany"; source: string; files: string[] }
  | { op: "search"; query: string; pkg?: string; limit?: number };

/**
 * Call an opensrc operation via the MCP bridge.
 *
 * In Claude Code the MCP server handles this automatically via .claude/settings.json.
 * This wrapper is for use in agentic-flow pipelines calling the skill programmatically.
 */
export async function callOpensrc(op: OpensrcOp): Promise<unknown> {
  const { op: action, ...params } = op as Record<string, unknown>;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add auth token if available
  const authToken = process.env.MCP_AUTH_TOKEN;
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch("http://localhost:3742/mcp", {
      method: "POST",
      headers,
      body: JSON.stringify({ method: `opensrc.${action}`, params }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`MCP bridge error: ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        `MCP bridge returned non-JSON content-type: ${contentType}`
      );
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ── Convenience helpers ────────────────────────────────────────────────

export const opensrc = {
  fetch: (source: string) => callOpensrc({ op: "fetch", source }),
  tree: (source: string, depth = 2) =>
    callOpensrc({ op: "tree", source, depth }),
  grep: (pattern: string, sources?: string[]) =>
    callOpensrc({ op: "grep", pattern, sources }),
  astGrep: (source: string, pattern: string) =>
    callOpensrc({ op: "astGrep", source, pattern }),
  read: (source: string, file: string) =>
    callOpensrc({ op: "read", source, file }),
  readMany: (source: string, files: string[]) =>
    callOpensrc({ op: "readMany", source, files }),
};

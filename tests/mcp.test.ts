import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { McpBridge } from "../lib/mcp.js";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("McpBridge", () => {
  let bridge: McpBridge;

  beforeEach(() => {
    bridge = new McpBridge();
  });

  afterEach(() => {
    if (bridge.started) {
      bridge.stopServer();
    }
  });

  it("starts in non-started state", () => {
    expect(bridge.started).toBe(false);
  });

  it("throws if starting twice", () => {
    // Use a simple cat process that reads stdin
    bridge.startServer({
      command: "cat",
      args: [],
      toolDirs: [],
    });
    expect(bridge.started).toBe(true);
    expect(() =>
      bridge.startServer({ command: "cat", args: [], toolDirs: [] }),
    ).toThrow("Server already running");
  });

  it("stops cleanly", () => {
    bridge.startServer({
      command: "cat",
      args: [],
      toolDirs: [],
    });
    bridge.stopServer();
    expect(bridge.started).toBe(false);
  });

  it("stopServer is safe to call when not started", () => {
    expect(() => bridge.stopServer()).not.toThrow();
  });

  it("communicates with a simple echo server", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-mcp-"));
    const serverScript = join(tmpDir, "echo-server.py");

    writeFileSync(
      serverScript,
      `import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    try:
        req = json.loads(line)
        resp = {"jsonrpc": "2.0", "id": req.get("id"), "result": {"echo": req.get("method")}}
        sys.stdout.write(json.dumps(resp) + "\\n")
        sys.stdout.flush()
    except: pass
`,
    );

    bridge.startServer({
      command: "python3",
      args: [serverScript],
      toolDirs: [tmpDir],
    });

    const tools = await bridge.listTools();
    // echo server returns empty tools list by echo of method
    expect(tools).toEqual([]);

    bridge.stopServer();
    rmSync(tmpDir, { recursive: true, force: true });
  });
});

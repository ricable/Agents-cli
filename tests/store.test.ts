import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createStore, generateContextMd } from "../lib/store.js";
import type { Tool, ToolStore } from "../lib/types.js";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function makeTool(overrides: Partial<Tool> = {}): Tool {
  return {
    id: "test-tool",
    meta: {
      name: "test-tool",
      version: "1.0.0",
      description: "A test tool",
      tags: ["test"],
    },
    source: { format: "github", uri: "owner/test-tool" },
    capabilities: {
      commands: [],
      globalFlags: [],
      analysisMethod: "help-probe",
    },
    installPath: "/tools/test-tool",
    status: "installed",
    installedAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("createStore", () => {
  let store: ToolStore;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-test-"));
    store = createStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("starts empty", async () => {
    const result = await store.list();
    expect(result.tools).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("saves and retrieves a tool", async () => {
    const tool = makeTool();
    await store.save(tool);
    const retrieved = await store.get("test-tool");
    expect(retrieved).toEqual(tool);
  });

  it("persists across instances", async () => {
    await store.save(makeTool());
    const store2 = createStore(tmpDir);
    const retrieved = await store2.get("test-tool");
    expect(retrieved?.meta.name).toBe("test-tool");
  });

  it("writes CONTEXT.md on save", async () => {
    await store.save(makeTool());
    const contextPath = join(tmpDir, "tools", "test-tool", "CONTEXT.md");
    expect(existsSync(contextPath)).toBe(true);
    const content = readFileSync(contextPath, "utf-8");
    expect(content).toContain("# test-tool");
    expect(content).toContain("A test tool");
  });

  it("checks existence", async () => {
    expect(await store.has("test-tool")).toBe(false);
    await store.save(makeTool());
    expect(await store.has("test-tool")).toBe(true);
  });

  it("removes a tool and cleans directory", async () => {
    await store.save(makeTool());
    const toolDir = join(tmpDir, "tools", "test-tool");
    expect(existsSync(toolDir)).toBe(true);
    expect(await store.remove("test-tool")).toBe(true);
    expect(await store.get("test-tool")).toBeNull();
    expect(existsSync(toolDir)).toBe(false);
  });

  it("returns false when removing nonexistent tool", async () => {
    expect(await store.remove("nope")).toBe(false);
  });

  it("filters by status", async () => {
    await store.save(makeTool({ id: "a", status: "installed" }));
    await store.save(makeTool({ id: "b", status: "failed" }));
    const result = await store.list({ status: "installed" });
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0]?.id).toBe("a");
  });

  it("filters by tags", async () => {
    await store.save(makeTool({ id: "a", meta: { ...makeTool().meta, tags: ["web"] } }));
    await store.save(makeTool({ id: "b", meta: { ...makeTool().meta, tags: ["cli"] } }));
    const result = await store.list({ tags: ["web"] });
    expect(result.tools).toHaveLength(1);
  });

  it("filters by text search", async () => {
    await store.save(makeTool({ id: "curl-tool", meta: { ...makeTool().meta, name: "curl-tool" } }));
    await store.save(makeTool({ id: "jq-tool", meta: { ...makeTool().meta, name: "jq-tool" } }));
    const result = await store.list({ text: "curl" });
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0]?.id).toBe("curl-tool");
  });

  it("paginates results", async () => {
    for (let i = 0; i < 5; i++) {
      await store.save(makeTool({ id: `tool-${i}` }));
    }
    const page = await store.list({ limit: 2, offset: 1 });
    expect(page.tools).toHaveLength(2);
    expect(page.total).toBe(5);
  });
});

describe("generateContextMd", () => {
  it("includes tool metadata", () => {
    const tool = makeTool({
      capabilities: {
        commands: [{ name: "run", description: "Run the tool", flags: [] }],
        globalFlags: [{ name: "--verbose", description: "Verbose output", type: "boolean", required: false }],
        analysisMethod: "flag-parse",
        rawHelp: "Usage: test-tool [options]",
      },
    });
    const md = generateContextMd(tool);
    expect(md).toContain("# test-tool");
    expect(md).toContain("A test tool");
    expect(md).toContain("## Commands");
    expect(md).toContain("`run`");
    expect(md).toContain("## Global Options");
    expect(md).toContain("`--verbose`");
    expect(md).toContain("## Raw Help Output");
  });

  it("handles minimal tool", () => {
    const md = generateContextMd(makeTool());
    expect(md).toContain("# test-tool");
    expect(md).not.toContain("## Commands");
  });
});

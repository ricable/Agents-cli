import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "../lib/store.js";
import type { Tool, ToolStore } from "../lib/types.js";

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

  beforeEach(() => {
    store = createStore("/tmp/test");
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

  it("checks existence", async () => {
    expect(await store.has("test-tool")).toBe(false);
    await store.save(makeTool());
    expect(await store.has("test-tool")).toBe(true);
  });

  it("removes a tool", async () => {
    await store.save(makeTool());
    expect(await store.remove("test-tool")).toBe(true);
    expect(await store.get("test-tool")).toBeNull();
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

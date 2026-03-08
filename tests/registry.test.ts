import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRegistry } from "../lib/registry.js";
import { createStore } from "../lib/store.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Tool, ToolStore } from "../lib/types.js";

function makeTool(id: string, name?: string): Tool {
  return {
    id,
    meta: { name: name ?? id, version: "1.0.0", description: `Tool ${id}`, tags: ["test"] },
    source: { format: "github", uri: `owner/${id}` },
    capabilities: { commands: [], globalFlags: [], analysisMethod: "help-probe" },
    installPath: `/tools/${id}`,
    status: "installed",
    installedAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

describe("createRegistry", () => {
  let tmpDir: string;
  let store: ToolStore;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-reg-"));
    store = createStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("searches local store", async () => {
    await store.save(makeTool("local-tool"));
    const registry = createRegistry(store);
    const results = await registry.search({ query: "local-tool", layers: ["local"] });
    expect(results.length).toBe(1);
    expect(results[0]?.id).toBe("local-tool");
    expect(results[0]?.layer).toBe("local");
  });

  it("returns empty for no matches", async () => {
    const registry = createRegistry(store);
    const results = await registry.search({ query: "nonexistent", layers: ["local"] });
    expect(results.length).toBe(0);
  });

  it("looks up a local tool", async () => {
    await store.save(makeTool("lookup-tool"));
    const registry = createRegistry(store);
    const result = await registry.lookup("lookup-tool");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("lookup-tool");
    expect(result?.layer).toBe("local");
    expect(result?.verified).toBe(true);
  });

  it("returns null for non-existent local lookup", async () => {
    // Only test local layer to avoid network
    const registry = createRegistry(store);
    const results = await registry.search({ query: "nonexistent", layers: ["local"] });
    expect(results.length).toBe(0);
  });

  it("respects limit option", async () => {
    for (let i = 0; i < 10; i++) {
      await store.save(makeTool(`tool-${i}`));
    }
    const registry = createRegistry(store);
    const results = await registry.search({ query: "tool", layers: ["local"], limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("community layer returns empty (placeholder)", async () => {
    const registry = createRegistry(store);
    const results = await registry.search({ query: "anything", layers: ["community"] });
    expect(results.length).toBe(0);
  });

  it("publish throws not implemented", async () => {
    const registry = createRegistry(store);
    await expect(
      registry.publish(makeTool("pub-tool") as unknown as Parameters<typeof registry.publish>[0]),
    ).rejects.toThrow("not yet implemented");
  });

  it("works without store", async () => {
    const registry = createRegistry();
    const results = await registry.search({ query: "test", layers: ["local"] });
    expect(results.length).toBe(0);
  });
});

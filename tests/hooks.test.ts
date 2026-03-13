import { describe, it, expect } from "vitest";
import { generateHooksJson, generateDomainHooks } from "../lib/hooks/generator.js";
import { validateHooksJson, validateHookScript } from "../lib/hooks/validator.js";
import { getHookConfig, getAllHookConfigs } from "../lib/hooks/templates/index.js";
import type { HooksJson } from "../lib/hooks/types.js";

describe("hooks/generator", () => {
  it("generateHooksJson produces valid hooks for database domain", () => {
    const result = generateHooksJson("database", ["prisma", "drizzle"]);
    expect(result.hooksJson.hooks.length).toBeGreaterThanOrEqual(5);
    // Should have all 7 event types
    const types = new Set(result.hooksJson.hooks.map(h => h.type));
    expect(types.has("PreToolUse")).toBe(true);
    expect(types.has("PostToolUse")).toBe(true);
    expect(types.has("Stop")).toBe(true);
    expect(types.has("SessionStart")).toBe(true);
    expect(types.has("SubagentStart")).toBe(true);
    expect(types.has("SubagentStop")).toBe(true);
    expect(types.has("Notification")).toBe(true);
  });

  it("generateHooksJson produces supporting scripts", () => {
    const result = generateHooksJson("python", ["ruff", "pytest"]);
    expect(result.scripts.length).toBeGreaterThan(0);
    for (const script of result.scripts) {
      expect(script.content).toContain("#!/bin/bash");
      expect(script.path).toMatch(/^hooks\//);
      expect(script.executable).toBe(true);
    }
  });

  it("generateDomainHooks is a convenience wrapper", () => {
    const result = generateDomainHooks("git");
    expect(result.hooksJson.hooks.length).toBeGreaterThan(0);
  });

  it("handles compound domains like ai-ml/llm-inference", () => {
    const result = generateHooksJson("ai-ml/llm-inference", ["vllm"]);
    expect(result.hooksJson.hooks.length).toBeGreaterThan(0);
  });

  it("handles unknown domains with default config", () => {
    const result = generateHooksJson("unknown-domain-xyz", []);
    expect(result.hooksJson.hooks.length).toBeGreaterThan(0);
    const types = new Set(result.hooksJson.hooks.map(h => h.type));
    expect(types.has("SessionStart")).toBe(true);
  });
});

describe("hooks/validator", () => {
  it("validates a correct hooks.json", () => {
    const hooksJson: HooksJson = {
      hooks: [
        {
          type: "PreToolUse",
          matchers: [{ tool_name: "Bash" }],
          command: "echo test",
          timeout: 5000,
        },
      ],
    };
    const errors = validateHooksJson(JSON.stringify(hooksJson));
    expect(errors).toEqual([]);
  });

  it("rejects invalid JSON", () => {
    const errors = validateHooksJson("not json");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("Invalid JSON");
  });

  it("rejects missing hooks array", () => {
    const errors = validateHooksJson('{"foo": "bar"}');
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects invalid event type", () => {
    const errors = validateHooksJson(JSON.stringify({
      hooks: [{ type: "InvalidEvent", matchers: [], command: "echo test" }],
    }));
    expect(errors.some(e => e.includes("unknown event type"))).toBe(true);
  });

  it("rejects empty command", () => {
    const errors = validateHooksJson(JSON.stringify({
      hooks: [{ type: "Stop", matchers: [], command: "" }],
    }));
    expect(errors.some(e => e.includes("command"))).toBe(true);
  });

  it("validates hook script with shebang", () => {
    const errors = validateHookScript("#!/bin/bash\nset -euo pipefail\nexit 0");
    expect(errors).toEqual([]);
  });

  it("warns on missing shebang", () => {
    const errors = validateHookScript("echo hello");
    expect(errors.some(e => e.includes("#!/bin/bash"))).toBe(true);
  });
});

describe("hooks/templates", () => {
  it("getHookConfig returns database config", () => {
    const config = getHookConfig("database");
    expect(config.domain).toBe("database");
    expect(config.blockPatterns).toBeDefined();
    expect(config.blockPatterns!.length).toBeGreaterThan(0);
  });

  it("getHookConfig falls back to base domain for compound", () => {
    const config = getHookConfig("security/audit");
    expect(config.blockPatterns).toBeDefined();
  });

  it("getHookConfig falls back to default for unknown", () => {
    const config = getHookConfig("absolutely-unknown");
    expect(config.contextInjections).toBeDefined();
  });

  it("getAllHookConfigs returns multiple domains", () => {
    const all = getAllHookConfigs();
    expect(Object.keys(all).length).toBeGreaterThan(5);
  });
});

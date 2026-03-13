import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { auditPlugin, auditAllPlugins, generateHtmlReport, generateJsonReport } from "../lib/plugin/audit-report.js";

describe("audit-report", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function createMinimalPlugin(pluginDir: string, opts?: { withHooks?: boolean; withAgents?: boolean }) {
    const metaDir = path.join(pluginDir, ".claude-plugin");
    const skillsDir = path.join(pluginDir, "skills", "test-tool");
    const agentsDir = path.join(pluginDir, "agents");
    const commandsDir = path.join(pluginDir, "commands");

    fs.mkdirSync(metaDir, { recursive: true });
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.mkdirSync(commandsDir, { recursive: true });

    fs.writeFileSync(path.join(metaDir, "plugin.json"), JSON.stringify({
      name: "test-plugin",
      version: "1.0.0",
      description: "Test plugin",
    }));

    fs.writeFileSync(path.join(skillsDir, "SKILL.md"), "---\nname: test-tool\ndescription: Test tool\n---\n# Test");

    if (opts?.withAgents) {
      fs.writeFileSync(path.join(agentsDir, "test-expert.md"), "---\nname: test-expert\ndescription: Test agent\n---\nYou are an expert.");
    }

    if (opts?.withHooks) {
      const hooksDir = path.join(pluginDir, "hooks");
      fs.mkdirSync(hooksDir, { recursive: true });
      fs.writeFileSync(path.join(hooksDir, "hooks.json"), JSON.stringify({
        hooks: [{ type: "Stop", matchers: [], command: "echo ok", timeout: 5000 }],
      }));
    }

    fs.writeFileSync(path.join(commandsDir, "search.md"), "---\ndescription: Search\n---\nSearch");
    fs.writeFileSync(path.join(commandsDir, "list.md"), "---\ndescription: List\n---\nList");
  }

  it("audits a minimal plugin", () => {
    const pluginDir = path.join(tmpDir, "test-plugin");
    createMinimalPlugin(pluginDir);

    const result = auditPlugin(pluginDir);
    expect(result.domain).toBe("test-plugin");
    expect(result.skillCount).toBe(1);
    expect(result.checks.length).toBeGreaterThan(3);
    expect(result.passed).toBe(true);
  });

  it("detects plugin with hooks", () => {
    const pluginDir = path.join(tmpDir, "test-plugin");
    createMinimalPlugin(pluginDir, { withHooks: true });

    const result = auditPlugin(pluginDir);
    expect(result.hookCount).toBe(1);
    expect(result.checks.find(c => c.name === "hooks.json valid")?.passed).toBe(true);
  });

  it("detects plugin with agents", () => {
    const pluginDir = path.join(tmpDir, "test-plugin");
    createMinimalPlugin(pluginDir, { withAgents: true });

    const result = auditPlugin(pluginDir);
    expect(result.agentCount).toBe(1);
  });

  it("audits all plugins in a directory", () => {
    createMinimalPlugin(path.join(tmpDir, "plugin-a"));
    createMinimalPlugin(path.join(tmpDir, "plugin-b"), { withHooks: true, withAgents: true });

    const summary = auditAllPlugins(tmpDir);
    expect(summary.totalPlugins).toBe(2);
    expect(summary.totalSkills).toBe(2);
  });

  it("handles empty directory", () => {
    const summary = auditAllPlugins(tmpDir);
    expect(summary.totalPlugins).toBe(0);
  });

  it("generates HTML report", () => {
    createMinimalPlugin(path.join(tmpDir, "test-plugin"));
    const summary = auditAllPlugins(tmpDir);
    const html = generateHtmlReport(summary);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Plugin Audit Report");
    expect(html).toContain("test-plugin");
  });

  it("generates JSON report", () => {
    createMinimalPlugin(path.join(tmpDir, "test-plugin"));
    const summary = auditAllPlugins(tmpDir);
    const json = generateJsonReport(summary);
    const parsed = JSON.parse(json);
    expect(parsed.totalPlugins).toBe(1);
  });
});

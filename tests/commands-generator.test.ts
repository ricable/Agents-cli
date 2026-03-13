import { describe, it, expect } from "vitest";
import { generatePluginCommands } from "../lib/plugin/commands-generator.js";
import type { ManifestEntry } from "../lib/types.js";

describe("commands-generator", () => {
  const entries: ManifestEntry[] = [
    { name: "ruff", repo: "astral-sh/ruff", domain: "python", description: "Python linter" },
    { name: "pytest", repo: "pytest-dev/pytest", domain: "python", description: "Python testing" },
  ];

  it("generates 8 commands", () => {
    const commands = generatePluginCommands("python", entries);
    expect(commands).toHaveLength(8);
  });

  it("generates all expected command filenames", () => {
    const commands = generatePluginCommands("python", entries);
    const filenames = commands.map(c => c.filename);
    expect(filenames).toContain("search.md");
    expect(filenames).toContain("list.md");
    expect(filenames).toContain("setup.md");
    expect(filenames).toContain("status.md");
    expect(filenames).toContain("audit.md");
    expect(filenames).toContain("run.md");
    expect(filenames).toContain("team.md");
    expect(filenames).toContain("update.md");
  });

  it("search command uses $ARGUMENTS", () => {
    const commands = generatePluginCommands("python", entries);
    const search = commands.find(c => c.filename === "search.md")!;
    expect(search.content).toContain("$ARGUMENTS");
  });

  it("list command uses disable-model-invocation", () => {
    const commands = generatePluginCommands("python", entries);
    const list = commands.find(c => c.filename === "list.md")!;
    expect(list.content).toContain("disable-model-invocation: true");
  });

  it("setup command uses context: fork", () => {
    const commands = generatePluginCommands("python", entries);
    const setup = commands.find(c => c.filename === "setup.md")!;
    expect(setup.content).toContain("context: fork");
  });

  it("commands have valid YAML frontmatter", () => {
    const commands = generatePluginCommands("database", entries);
    for (const cmd of commands) {
      expect(cmd.content).toMatch(/^---\n/);
      expect(cmd.content).toContain("description:");
    }
  });
});

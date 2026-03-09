/**
 * Tests for the plugin generation pipeline:
 *   - lib/plugin/builder.ts
 *   - lib/plugin/marketplace.ts
 *   - lib/plugin/ai-generator.ts
 *   - lib/plugin/shared.ts
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { buildPlugins } from "../lib/plugin/builder.js";
import { generateMarketplace } from "../lib/plugin/marketplace.js";
import {
  defaultAgentDef,
  defaultAgentMarkdown,
  generateAgentDefs,
} from "../lib/plugin/ai-generator.js";
import {
  assertWithinDir,
  validatePluginName,
  readPluginManifest,
  countPluginSkills,
  copyDirSafe,
} from "../lib/plugin/shared.js";

// ── Test fixtures ──────────────────────────────────────────────────────

let tmpDir: string;

function createTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "plugin-test-"));
}

function createSkillFixture(dir: string, name: string, domain: string): void {
  const skillDir = path.join(dir, name);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    [
      "---",
      `name: ${name}`,
      `description: "Test tool ${name}. Use when testing ${name}."`,
      `domain: "${domain}"`,
      "version: 1.0.0",
      "license: MIT",
      "tags:",
      `  - ${domain}, cli-tool`,
      "---",
      "",
      `# ${name}`,
      "",
      "Quick start content here.",
    ].join("\n"),
    "utf-8"
  );

  // Add references/ and scripts/
  const refsDir = path.join(skillDir, "references");
  fs.mkdirSync(refsDir, { recursive: true });
  fs.writeFileSync(path.join(refsDir, "guide.md"), `# Guide for ${name}\n`, "utf-8");

  const scriptsDir = path.join(skillDir, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(path.join(scriptsDir, "install.sh"), `#!/bin/bash\necho "install ${name}"\n`, "utf-8");
}

function createManifest(dir: string, entries: Array<{ name: string; domain: string }>): string {
  const manifestPath = path.join(dir, "skills-manifest.json");
  const repos = entries.map(e => ({
    name: e.name,
    repo: "",
    domain: e.domain,
    description: `Test tool ${e.name}`,
  }));
  fs.writeFileSync(manifestPath, JSON.stringify({ repos }, null, 2), "utf-8");
  return manifestPath;
}

beforeEach(() => {
  tmpDir = createTmpDir();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── shared.ts ──────────────────────────────────────────────────────────

describe("shared: assertWithinDir", () => {
  it("accepts paths within base", () => {
    expect(() => assertWithinDir("/a/b/c", "/a/b", "test")).not.toThrow();
  });

  it("rejects paths escaping base", () => {
    expect(() => assertWithinDir("/a/x/c", "/a/b", "test")).toThrow(/escapes base directory/);
  });

  it("accepts base itself", () => {
    expect(() => assertWithinDir("/a/b", "/a/b", "test")).not.toThrow();
  });
});

describe("shared: validatePluginName", () => {
  it("accepts valid names", () => {
    expect(() => validatePluginName("my-tool", "test")).not.toThrow();
    expect(() => validatePluginName("ruff", "test")).not.toThrow();
    expect(() => validatePluginName("prisma", "test")).not.toThrow();
  });

  it("rejects path traversal", () => {
    expect(() => validatePluginName("../etc/passwd", "test")).toThrow(/path traversal/);
    expect(() => validatePluginName("foo/../bar", "test")).toThrow(/path traversal/);
  });

  it("rejects slashes", () => {
    expect(() => validatePluginName("foo/bar", "test")).toThrow(/path traversal/);
    expect(() => validatePluginName("foo\\bar", "test")).toThrow(/path traversal/);
  });

  it("rejects hidden file names", () => {
    expect(() => validatePluginName(".secret", "test")).toThrow(/must not start/);
  });

  it("rejects null bytes", () => {
    expect(() => validatePluginName("foo\0bar", "test")).toThrow(/path traversal/);
  });
});

describe("shared: readPluginManifest", () => {
  it("reads valid plugin.json", () => {
    const pluginDir = path.join(tmpDir, "test-plugin");
    const metaDir = path.join(pluginDir, ".claude-plugin");
    fs.mkdirSync(metaDir, { recursive: true });
    fs.writeFileSync(
      path.join(metaDir, "plugin.json"),
      JSON.stringify({ name: "test", version: "2.0.0", description: "A test plugin", keywords: ["foo"] }),
    );

    const result = readPluginManifest(pluginDir);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("test");
    expect(result!.version).toBe("2.0.0");
    expect(result!.keywords).toEqual(["foo"]);
  });

  it("returns null for missing manifest", () => {
    expect(readPluginManifest(tmpDir)).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    const metaDir = path.join(tmpDir, ".claude-plugin");
    fs.mkdirSync(metaDir, { recursive: true });
    fs.writeFileSync(path.join(metaDir, "plugin.json"), "not json{{{");
    expect(readPluginManifest(tmpDir)).toBeNull();
  });
});

describe("shared: countPluginSkills", () => {
  it("counts SKILL.md files", () => {
    const skillsDir = path.join(tmpDir, "skills");
    fs.mkdirSync(path.join(skillsDir, "foo"), { recursive: true });
    fs.mkdirSync(path.join(skillsDir, "bar"), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, "foo", "SKILL.md"), "# foo");
    fs.writeFileSync(path.join(skillsDir, "bar", "SKILL.md"), "# bar");

    expect(countPluginSkills(tmpDir)).toBe(2);
  });

  it("returns 0 for no skills dir", () => {
    expect(countPluginSkills(tmpDir)).toBe(0);
  });
});

describe("shared: copyDirSafe", () => {
  it("copies files recursively", () => {
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "dest");
    fs.mkdirSync(path.join(src, "sub"), { recursive: true });
    fs.writeFileSync(path.join(src, "a.txt"), "hello");
    fs.writeFileSync(path.join(src, "sub", "b.txt"), "world");

    copyDirSafe(src, dest, tmpDir);

    expect(fs.readFileSync(path.join(dest, "a.txt"), "utf-8")).toBe("hello");
    expect(fs.readFileSync(path.join(dest, "sub", "b.txt"), "utf-8")).toBe("world");
  });

  it("rejects destination outside base", () => {
    const src = path.join(tmpDir, "src");
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, "a.txt"), "hello");

    expect(() => copyDirSafe(src, "/tmp/evil-dest", tmpDir)).toThrow(/escapes base/);
  });

  it("skips symlinks", () => {
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "dest");
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, "real.txt"), "content");
    fs.symlinkSync("/etc/hosts", path.join(src, "link.txt"));

    copyDirSafe(src, dest, tmpDir);

    expect(fs.existsSync(path.join(dest, "real.txt"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "link.txt"))).toBe(false);
  });
});

// ── ai-generator.ts ────────────────────────────────────────────────────

describe("ai-generator: defaultAgentDef", () => {
  it("produces valid agent def", () => {
    const def = defaultAgentDef("database");
    expect(def.name).toBe("database-expert");
    expect(def.description).toContain("database");
    expect(def.allowedTools).toEqual(["Read", "Grep", "Glob", "Bash"]);
  });
});

describe("ai-generator: defaultAgentMarkdown", () => {
  it("produces valid markdown with frontmatter", () => {
    const agent = defaultAgentMarkdown("security", ["trivy", "grype"]);
    expect(agent.name).toBe("security-expert");
    expect(agent.content).toContain("---");
    expect(agent.content).toContain("name: security-expert");
    expect(agent.content).toContain("trivy");
    expect(agent.content).toContain("grype");
    expect(agent.content).toContain("Use when");
  });

  it("flattens slashes in domain for agent name", () => {
    const agent = defaultAgentMarkdown("ai-ml/llm-inference", ["vllm"]);
    expect(agent.name).toBe("ai-ml-llm-inference-expert");
  });
});

describe("ai-generator: generateAgentDefs (legacy)", () => {
  it("returns default def without API key", async () => {
    const defs = await generateAgentDefs("testing", ["vitest"], "");
    expect(defs).toHaveLength(1);
    expect(defs[0]!.name).toBe("testing-expert");
  });
});

// ── builder.ts ─────────────────────────────────────────────────────────

describe("builder: buildPlugins", () => {
  it("builds spec-compliant plugin structure", async () => {
    const skillsDir = path.join(tmpDir, "skills");
    createSkillFixture(skillsDir, "prisma", "database");
    createSkillFixture(skillsDir, "drizzle-kit", "database");

    const manifestPath = createManifest(tmpDir, [
      { name: "prisma", domain: "database" },
      { name: "drizzle-kit", domain: "database" },
    ]);

    const pluginsDir = path.join(tmpDir, "plugins");
    const result = await buildPlugins({
      manifestPath,
      pluginsDir,
      skillsSourceDir: skillsDir,
    });

    expect(result.pluginCount).toBe(1);
    expect(result.skillsCopied).toBe(2);

    // Verify .claude-plugin/plugin.json exists
    const manifestFile = path.join(pluginsDir, "database", ".claude-plugin", "plugin.json");
    expect(fs.existsSync(manifestFile)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf-8"));
    expect(manifest.name).toBe("database");
    expect(manifest.version).toBe("1.0.0");
    // No non-standard fields
    expect(manifest.domain).toBeUndefined();
    expect(manifest.skills).toBeUndefined();
    expect(manifest.agents).toBeUndefined();

    // Verify skills copied
    expect(fs.existsSync(path.join(pluginsDir, "database", "skills", "prisma", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(pluginsDir, "database", "skills", "prisma", "references", "guide.md"))).toBe(true);
    expect(fs.existsSync(path.join(pluginsDir, "database", "skills", "prisma", "scripts", "install.sh"))).toBe(true);

    // Verify agents
    expect(fs.existsSync(path.join(pluginsDir, "database", "agents", "database-expert.md"))).toBe(true);

    // Verify commands
    expect(fs.existsSync(path.join(pluginsDir, "database", "commands", "search.md"))).toBe(true);
    expect(fs.existsSync(path.join(pluginsDir, "database", "commands", "list.md"))).toBe(true);
  });

  it("dry-run returns counts without writing files", async () => {
    const manifestPath = createManifest(tmpDir, [
      { name: "prisma", domain: "database" },
    ]);

    const pluginsDir = path.join(tmpDir, "plugins");
    const result = await buildPlugins({
      manifestPath,
      pluginsDir,
      dryRun: true,
    });

    expect(result.pluginCount).toBe(1);
    expect(result.domains).toEqual(["database"]);
    expect(fs.existsSync(pluginsDir)).toBe(false);
  });

  it("flattens nested domains", async () => {
    const manifestPath = createManifest(tmpDir, [
      { name: "vllm", domain: "ai-ml/llm-inference" },
    ]);

    const pluginsDir = path.join(tmpDir, "plugins");
    await buildPlugins({ manifestPath, pluginsDir });

    expect(fs.existsSync(path.join(pluginsDir, "ai-ml-llm-inference", ".claude-plugin", "plugin.json"))).toBe(true);
    // No nested dir
    expect(fs.existsSync(path.join(pluginsDir, "ai-ml", "llm-inference"))).toBe(false);
  });

  it("rejects path-traversal skill names", async () => {
    const skillsDir = path.join(tmpDir, "skills");
    createSkillFixture(skillsDir, "legit-tool", "testing");

    const manifestPath = createManifest(tmpDir, [
      { name: "legit-tool", domain: "testing" },
      { name: "../escape", domain: "testing" },
    ]);

    const pluginsDir = path.join(tmpDir, "plugins");
    // Should not throw — silently skips invalid names
    const result = await buildPlugins({
      manifestPath,
      pluginsDir,
      skillsSourceDir: skillsDir,
    });

    expect(result.skillsCopied).toBe(1); // only legit-tool
  });

  it("filters by domain when specified", async () => {
    const manifestPath = createManifest(tmpDir, [
      { name: "prisma", domain: "database" },
      { name: "trivy", domain: "security" },
    ]);

    const pluginsDir = path.join(tmpDir, "plugins");
    const result = await buildPlugins({
      manifestPath,
      pluginsDir,
      domain: "database",
    });

    expect(result.pluginCount).toBe(1);
    expect(result.domains).toEqual(["database"]);
    expect(fs.existsSync(path.join(pluginsDir, "security"))).toBe(false);
  });

  it("infers license from skill frontmatter", async () => {
    const skillsDir = path.join(tmpDir, "skills");
    createSkillFixture(skillsDir, "prisma", "database");

    const manifestPath = createManifest(tmpDir, [
      { name: "prisma", domain: "database" },
    ]);

    const pluginsDir = path.join(tmpDir, "plugins");
    await buildPlugins({
      manifestPath,
      pluginsDir,
      skillsSourceDir: skillsDir,
    });

    const manifest = JSON.parse(
      fs.readFileSync(path.join(pluginsDir, "database", ".claude-plugin", "plugin.json"), "utf-8")
    );
    expect(manifest.license).toBe("MIT");
  });
});

// ── marketplace.ts ─────────────────────────────────────────────────────

describe("marketplace: generateMarketplace", () => {
  it("generates marketplace.json from built plugins", async () => {
    // First build plugins
    const skillsDir = path.join(tmpDir, "skills");
    createSkillFixture(skillsDir, "prisma", "database");

    const manifestPath = createManifest(tmpDir, [
      { name: "prisma", domain: "database" },
    ]);

    const pluginsDir = path.join(tmpDir, "plugins");
    await buildPlugins({ manifestPath, pluginsDir, skillsSourceDir: skillsDir });

    // Then generate marketplace
    const mktDir = path.join(tmpDir, "marketplace");
    const result = await generateMarketplace({
      outputDir: mktDir,
      pluginsSourceDir: pluginsDir,
      config: {
        name: "test-marketplace",
        ownerName: "test",
        ownerEmail: "test@test.com",
        version: "1.0.0",
        homepage: "",
        repository: "",
      },
    });

    expect(result.pluginCount).toBe(1);
    expect(result.skillCount).toBe(1);

    const mktJson = JSON.parse(fs.readFileSync(path.join(mktDir, "marketplace.json"), "utf-8"));
    expect(mktJson.name).toBe("test-marketplace");
    expect(mktJson.plugins).toHaveLength(1);
    expect(mktJson.plugins[0].name).toBe("database");
    expect(mktJson.plugins[0].source).toBe("./plugins/database");
  });

  it("dry-run returns counts without writing", async () => {
    const result = await generateMarketplace({
      outputDir: path.join(tmpDir, "marketplace"),
      pluginsSourceDir: path.join(tmpDir, "no-plugins"),
      config: { name: "x", ownerName: "x", ownerEmail: "", version: "1.0.0", homepage: "", repository: "" },
      dryRun: true,
    });

    expect(result.pluginCount).toBe(0);
    expect(result.skillCount).toBe(0);
  });
});

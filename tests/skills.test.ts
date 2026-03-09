import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  chmodSync,
  rmSync,
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseFrontmatter,
  generateSkillMd,
  buildContext,
  generateLockfile,
  parseLockfile,
  writeLockfile,
  readLockfile,
  installSkill,
  generateRichSkillMd,
  generateSkillDirectory,
  isLikelyCli,
  inferLibraryInstallCommand,
} from "../lib/skills.js";
import { testSkillSync, scoreTrigger, domainMatches, scoreContentQuality } from "../lib/skill-tester.js";
import { extractCommandsFromReadme } from "../lib/extractor.js";
import type { Tool, Skill } from "../lib/types.js";

// =============================================================================
// parseFrontmatter
// =============================================================================

describe("parseFrontmatter", () => {
  it("parses basic frontmatter with all fields", () => {
    const content = `---
name: my-skill
version: 1.0.0
description: A test skill
ingredients:
  - ruvnet/ruflo
  - @claude-flow/cli
tags:
  - ai
  - automation
---

# My Skill

Some body content here.
`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("my-skill");
    expect(result!.version).toBe("1.0.0");
    expect(result!.description).toBe("A test skill");
    expect(result!.ingredients).toEqual(["ruvnet/ruflo", "@claude-flow/cli"]);
    expect(result!.tags).toEqual(["ai", "automation"]);
  });

  it("parses frontmatter with inline arrays", () => {
    const content = `---
name: inline-skill
version: 0.2.0
description: Skill with inline arrays
ingredients: [foo/bar, baz/qux]
tags: [web, scraping]
---

Body text.
`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.ingredients).toEqual(["foo/bar", "baz/qux"]);
    expect(result!.tags).toEqual(["web", "scraping"]);
  });

  it("parses frontmatter with empty arrays", () => {
    const content = `---
name: empty-skill
version: 0.1.0
description: No ingredients
ingredients: []
tags: []
---
`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.ingredients).toEqual([]);
    expect(result!.tags).toEqual([]);
  });

  it("parses frontmatter with quoted values", () => {
    const content = `---
name: "quoted-skill"
version: '2.0.0'
description: "A skill with quoted values"
ingredients:
  - "ruvnet/tool"
tags:
  - 'tagged'
---
`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("quoted-skill");
    expect(result!.version).toBe("2.0.0");
    expect(result!.description).toBe("A skill with quoted values");
    expect(result!.ingredients).toEqual(["ruvnet/tool"]);
    expect(result!.tags).toEqual(["tagged"]);
  });

  it("returns null when missing required fields", () => {
    const noName = `---
version: 1.0.0
description: Missing name
---
`;
    expect(parseFrontmatter(noName)).toBeNull();

    const noDesc = `---
name: no-desc
version: 1.0.0
---
`;
    expect(parseFrontmatter(noDesc)).toBeNull();
  });

  it("defaults version to 0.0.0 when omitted", () => {
    const content = `---
name: no-version
description: Missing version
---
`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.version).toBe("0.0.0");
  });

  it("returns null when no frontmatter delimiters", () => {
    expect(parseFrontmatter("Just some text")).toBeNull();
    expect(parseFrontmatter("")).toBeNull();
  });

  it("returns null for malformed frontmatter", () => {
    const malformed = `---
this is not valid yaml at all
---
`;
    // Should return null since required fields are missing
    expect(parseFrontmatter(malformed)).toBeNull();
  });

  it("handles frontmatter with comments", () => {
    const content = `---
name: commented
version: 1.0.0
description: Has comments
# This is a comment
ingredients:
  - foo/bar
tags: []
---
`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("commented");
    expect(result!.ingredients).toEqual(["foo/bar"]);
  });

  it("handles missing ingredients and tags gracefully", () => {
    const content = `---
name: minimal
version: 1.0.0
description: No ingredients or tags fields
---
`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.ingredients).toEqual([]);
    expect(result!.tags).toEqual([]);
  });

  it("parses frontmatter with Windows-style line endings", () => {
    const content = "---\r\nname: windows\r\nversion: 1.0.0\r\ndescription: CRLF\r\ningredients: []\r\ntags: []\r\n---\r\nBody\r\n";
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("windows");
  });
});

// =============================================================================
// generateSkillMd
// =============================================================================

describe("generateSkillMd", () => {
  it("generates valid SKILL.md content", () => {
    const md = generateSkillMd("web-scraper", "Scrape websites for data");
    expect(md).toContain("name: web-scraper");
    expect(md).toContain("version: 0.1.0");
    expect(md).toContain("description: Scrape websites for data");
    expect(md).toContain("# web-scraper");
    expect(md).toContain("---");
  });

  it("generates content that can be round-tripped through parseFrontmatter", () => {
    const md = generateSkillMd("roundtrip-test", "Testing roundtrip");
    const parsed = parseFrontmatter(md);
    expect(parsed).not.toBeNull();
    expect(parsed!.name).toBe("roundtrip-test");
    expect(parsed!.version).toBe("0.1.0");
    // Description is now trigger-aware
    expect(parsed!.description).toContain("Testing roundtrip");
    expect(parsed!.ingredients).toEqual([]);
    expect(parsed!.tags.length).toBeGreaterThan(0);
  });

  it("generates trigger-aware description and skill-named tag", () => {
    const md = generateSkillMd("test-skill", "A test");
    expect(md).toContain("ingredients: []");
    expect(md).toContain("test-skill");
    // Description includes trigger hint
    expect(md).toContain("Use when");
  });

  it("includes usage section", () => {
    const md = generateSkillMd("usage-test", "Testing usage");
    expect(md).toContain("## Quick Start");
  });
});

// =============================================================================
// Lockfile: generateLockfile / parseLockfile roundtrip
// =============================================================================

describe("Lockfile", () => {
  function makeTool(id: string, version: string, uri: string): Tool {
    return {
      id,
      meta: {
        name: id,
        version,
        description: `Tool ${id}`,
        tags: ["test"],
      },
      source: {
        format: "github",
        uri,
        ref: "main",
      },
      capabilities: {
        commands: [],
        globalFlags: [],
        analysisMethod: "help-probe",
      },
      installPath: `/tmp/tools/${id}`,
      status: "installed",
      installedAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
  }

  it("generates a valid lockfile from tools", () => {
    const tools = [
      makeTool("tool-a", "1.0.0", "owner/tool-a"),
      makeTool("tool-b", "2.0.0", "owner/tool-b"),
    ];

    const lockfile = generateLockfile(tools);
    expect(lockfile.version).toBe(1);
    expect(lockfile.entries).toHaveLength(2);
    expect(lockfile.generatedAt).toBeTruthy();

    const entryA = lockfile.entries[0]!;
    expect(entryA.id).toBe("tool-a");
    expect(entryA.version).toBe("1.0.0");
    expect(entryA.source.uri).toBe("owner/tool-a");
    expect(entryA.integrity).toBeTruthy();
    expect(entryA.integrity).toMatch(/^[a-f0-9]{64}$/);
  });

  it("roundtrips through generate and parse", () => {
    const tools = [
      makeTool("alpha", "1.2.3", "org/alpha"),
      makeTool("beta", "0.5.0", "org/beta"),
    ];

    const lockfile = generateLockfile(tools);
    const json = JSON.stringify(lockfile, null, 2);
    const parsed = parseLockfile(json);

    expect(parsed).not.toBeNull();
    expect(parsed!.version).toBe(1);
    expect(parsed!.entries).toHaveLength(2);
    expect(parsed!.entries[0]!.id).toBe("alpha");
    expect(parsed!.entries[0]!.version).toBe("1.2.3");
    expect(parsed!.entries[0]!.integrity).toBe(lockfile.entries[0]!.integrity);
    expect(parsed!.entries[1]!.id).toBe("beta");
  });

  it("parseLockfile returns null for invalid JSON", () => {
    expect(parseLockfile("not json")).toBeNull();
  });

  it("parseLockfile returns null for wrong version", () => {
    expect(parseLockfile(JSON.stringify({ version: 2, entries: [], generatedAt: "x" }))).toBeNull();
  });

  it("parseLockfile returns null for missing entries", () => {
    expect(parseLockfile(JSON.stringify({ version: 1, generatedAt: "x" }))).toBeNull();
  });

  it("parseLockfile returns null for missing generatedAt", () => {
    expect(parseLockfile(JSON.stringify({ version: 1, entries: [] }))).toBeNull();
  });

  it("parseLockfile returns null for malformed entries", () => {
    const bad = JSON.stringify({
      version: 1,
      entries: [{ id: "foo" }], // missing version, integrity, source
      generatedAt: "x",
    });
    expect(parseLockfile(bad)).toBeNull();
  });

  it("integrity hash is deterministic for same input", () => {
    const tools = [makeTool("det-tool", "3.0.0", "org/det-tool")];
    const lock1 = generateLockfile(tools);
    const lock2 = generateLockfile(tools);
    expect(lock1.entries[0]!.integrity).toBe(lock2.entries[0]!.integrity);
  });

  it("integrity hash differs for different versions", () => {
    const toolA = makeTool("same-tool", "1.0.0", "org/same-tool");
    const toolB = makeTool("same-tool", "2.0.0", "org/same-tool");
    const lockA = generateLockfile([toolA]);
    const lockB = generateLockfile([toolB]);
    expect(lockA.entries[0]!.integrity).not.toBe(lockB.entries[0]!.integrity);
  });

  it("generates an empty lockfile for no tools", () => {
    const lockfile = generateLockfile([]);
    expect(lockfile.entries).toHaveLength(0);
    expect(lockfile.version).toBe(1);
  });

  describe("writeLockfile / readLockfile", () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-lock-"));
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it("writes and reads a lockfile from disk", () => {
      const tools = [
        makeTool("disk-a", "1.0.0", "org/disk-a"),
        makeTool("disk-b", "2.0.0", "org/disk-b"),
      ];
      const lockPath = join(tmpDir, "agentcli.lock");
      writeLockfile(lockPath, tools);

      expect(existsSync(lockPath)).toBe(true);
      const content = readFileSync(lockPath, "utf-8");
      expect(JSON.parse(content).version).toBe(1);

      const read = readLockfile(lockPath);
      expect(read).not.toBeNull();
      expect(read!.entries).toHaveLength(2);
      expect(read!.entries[0]!.id).toBe("disk-a");
    });

    it("readLockfile returns null for non-existent file", () => {
      const result = readLockfile(join(tmpDir, "nonexistent.lock"));
      expect(result).toBeNull();
    });
  });
});

// =============================================================================
// buildContext
// =============================================================================

describe("buildContext", () => {
  function makeTool(id: string, desc: string): Tool {
    return {
      id,
      meta: {
        name: id,
        version: "1.0.0",
        description: desc,
        tags: [],
      },
      source: { format: "local", uri: `/tmp/${id}` },
      capabilities: {
        commands: [{ name: "run", description: "Run the tool", flags: [] }],
        globalFlags: [{ name: "--verbose", description: "Verbose output", type: "boolean", required: false }],
        analysisMethod: "flag-parse",
      },
      installPath: `/tmp/tools/${id}`,
      status: "installed",
      installedAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
  }

  it("assembles context from skill description and tool CONTEXT.md files", () => {
    const skill: Skill = {
      frontmatter: {
        name: "test-skill",
        version: "1.0.0",
        description: "A test skill for context building",
        ingredients: ["foo/bar"],
        tags: ["test"],
      },
      body: "This is the body of the skill.\n\nIt has multiple paragraphs.",
      ingredients: [
        makeTool("bar", "A bar tool"),
        makeTool("baz", "A baz tool"),
      ],
      contextPath: "/tmp/context.md",
    };

    const context = buildContext(skill);

    // Should start with skill name as heading
    expect(context).toContain("# test-skill");
    // Should include skill description
    expect(context).toContain("A test skill for context building");
    // Should include body
    expect(context).toContain("This is the body of the skill.");
    expect(context).toContain("It has multiple paragraphs.");
    // Should include tool sections in progressive format
    expect(context).toContain("## Installed Tools");
    expect(context).toContain("### bar@1.0.0");
    expect(context).toContain("A bar tool");
    expect(context).toContain("### baz@1.0.0");
    expect(context).toContain("A baz tool");
  });

  it("handles skill with no body", () => {
    const skill: Skill = {
      frontmatter: {
        name: "no-body",
        version: "1.0.0",
        description: "Skill without body",
        ingredients: [],
        tags: [],
      },
      body: "",
      ingredients: [],
      contextPath: "/tmp/context.md",
    };

    const context = buildContext(skill);
    expect(context).toContain("# no-body");
    expect(context).toContain("Skill without body");
  });

  it("handles skill with no ingredients", () => {
    const skill: Skill = {
      frontmatter: {
        name: "empty",
        version: "1.0.0",
        description: "Empty skill",
        ingredients: [],
        tags: [],
      },
      body: "Just a body.",
      ingredients: [],
      contextPath: "/tmp/context.md",
    };

    const context = buildContext(skill);
    expect(context).toContain("# empty");
    expect(context).toContain("Just a body.");
    // No tool sections
    expect(context).not.toContain("---\n\n#");
  });

  it("includes tool commands and flags in context", () => {
    const skill: Skill = {
      frontmatter: {
        name: "with-caps",
        version: "1.0.0",
        description: "Skill with tool capabilities",
        ingredients: [],
        tags: [],
      },
      body: "",
      ingredients: [makeTool("capable", "A capable tool")],
      contextPath: "/tmp/context.md",
    };

    const context = buildContext(skill);
    expect(context).toContain("**Commands**: `run`");
    expect(context).toContain("**Flags**: `--verbose`");
  });
});

// =============================================================================
// installSkill with local fixtures
// =============================================================================

describe("installSkill", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agents-cli-skill-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  /** Create a local fixture tool directory */
  function createFixtureTool(name: string): string {
    const toolDir = join(tmpDir, "fixture-tools", name);
    mkdirSync(join(toolDir, "bin"), { recursive: true });

    const helpText = `Usage: ${name} [options]\n\nA fixture tool\n\nOptions:\n  --verbose    Verbose mode\n`;
    const script = `#!/usr/bin/env node
if (process.argv.includes('--help')) {
  console.log(${JSON.stringify(helpText)});
  process.exit(0);
}
console.log('${name} running');
`;
    writeFileSync(join(toolDir, "bin", name), script);
    chmodSync(join(toolDir, "bin", name), 0o755);

    writeFileSync(
      join(toolDir, "package.json"),
      JSON.stringify({
        name,
        version: "1.0.0",
        description: `Fixture: ${name}`,
        bin: { [name]: `./bin/${name}` },
      }),
    );

    return toolDir;
  }

  it("installs a skill from a SKILL.md with local ingredients", async () => {
    const tool1Path = createFixtureTool("fix-tool-1");
    const tool2Path = createFixtureTool("fix-tool-2");

    const skillMd = `---
name: test-skill
version: 1.0.0
description: A test skill with local tools
ingredients:
  - ${tool1Path}
  - ${tool2Path}
tags:
  - test
---

# Test Skill

This is a test skill body.
`;
    const skillPath = join(tmpDir, "SKILL.md");
    writeFileSync(skillPath, skillMd);

    const dataDir = join(tmpDir, "data");
    const skill = await installSkill(skillPath, dataDir);

    expect(skill.frontmatter.name).toBe("test-skill");
    expect(skill.frontmatter.version).toBe("1.0.0");
    expect(skill.ingredients).toHaveLength(2);
    expect(skill.ingredients[0]!.meta.version).toBe("1.0.0");
    expect(skill.ingredients[1]!.meta.version).toBe("1.0.0");
    expect(skill.body).toContain("This is a test skill body.");

    // Context file should be written
    expect(existsSync(skill.contextPath)).toBe(true);
    const contextContent = readFileSync(skill.contextPath, "utf-8");
    expect(contextContent).toContain("# test-skill");
    expect(contextContent).toContain("A test skill with local tools");
  });

  it("throws for invalid SKILL.md frontmatter", async () => {
    const skillPath = join(tmpDir, "bad-skill.md");
    writeFileSync(skillPath, "No frontmatter here");

    await expect(installSkill(skillPath, join(tmpDir, "data"))).rejects.toThrow(
      "Failed to parse SKILL.md frontmatter",
    );
  });

  it("installs a skill with zero ingredients", async () => {
    const skillMd = `---
name: empty-skill
version: 0.1.0
description: No ingredients here
ingredients: []
tags: []
---

Just a body.
`;
    const skillPath = join(tmpDir, "empty-skill.md");
    writeFileSync(skillPath, skillMd);

    const dataDir = join(tmpDir, "data-empty");
    const skill = await installSkill(skillPath, dataDir);

    expect(skill.frontmatter.name).toBe("empty-skill");
    expect(skill.ingredients).toHaveLength(0);
    expect(existsSync(skill.contextPath)).toBe(true);
  });
});

// =============================================================================
// Spec-compliant skill generation (battle test)
// =============================================================================

/** Create a mock Tool for testing generation */
function makeMockTool(overrides: Partial<Tool> = {}): Tool {
  return {
    id: "ruff",
    meta: {
      name: "ruff",
      version: "0.1.0",
      description: "An extremely fast Python linter and code formatter, written in Rust",
      license: "MIT",
      tags: ["python", "linter", "formatter"],
    },
    source: { format: "pypi", uri: "pypi:ruff" },
    capabilities: {
      commands: [
        { name: "check", description: "Check files for issues", flags: [
          { name: "--fix", description: "Auto-fix issues", type: "boolean", required: false },
        ] },
        { name: "format", description: "Format files", flags: [] },
        { name: "rule", description: "Show rule details", flags: [] },
      ],
      globalFlags: [
        { name: "--config", description: "Config file", type: "string", required: false },
      ],
      analysisMethod: "help-probe",
    },
    installPath: "/tmp/tools/ruff",
    status: "installed",
    installedAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("spec-compliant skill generation", () => {

  describe("buildDescription via generateRichSkillMd", () => {
    it("produces 'Use when' with action verbs, no 'CLI tool:' prefix", () => {
      const tool = makeMockTool();
      const md = generateRichSkillMd(tool);
      const fm = parseFrontmatter(md);
      expect(fm).not.toBeNull();
      expect(fm!.description).toContain("Use when");
      expect(fm!.description).not.toMatch(/^CLI tool:/i);
      expect(fm!.description!.length).toBeLessThanOrEqual(1024);
    });

    it("uses domain-inferred triggers for tools without commands", () => {
      const tool = makeMockTool({
        capabilities: { commands: [], globalFlags: [], analysisMethod: "help-probe" },
      });
      const md = generateRichSkillMd(tool);
      const fm = parseFrontmatter(md);
      expect(fm!.description).toContain("Use when");
      // Should use linter domain triggers, not "the task involves"
      expect(fm!.description).not.toContain("the task involves");
    });
  });

  describe("generateRichSkillMd frontmatter compliance", () => {
    it("has kebab-case name, license, and compatibility", () => {
      const tool = makeMockTool();
      const md = generateRichSkillMd(tool);
      // Check frontmatter fields
      expect(md).toContain("name: ruff");
      expect(md).toContain("license: MIT");
      expect(md).toContain('compatibility: "Python 3.10+"');
    });

    it("normalizes names to kebab-case", () => {
      const tool = makeMockTool({
        meta: { ...makeMockTool().meta, name: "MyTool_v2" },
      });
      const md = generateRichSkillMd(tool);
      expect(md).toMatch(/^name: mytool-v2$/m);
    });

    it("strips reserved words from names", () => {
      const tool = makeMockTool({
        meta: { ...makeMockTool().meta, name: "claude-helper" },
      });
      const md = generateRichSkillMd(tool);
      // "claude" stripped, leaving "helper"
      expect(md).toMatch(/^name: helper$/m);
    });
  });

  describe("generateSkillDirectory structure", () => {
    it("always produces references/guide.md", () => {
      const tool = makeMockTool();
      const dir = generateSkillDirectory(tool);
      expect(dir.files["references/guide.md"]).toBeDefined();
      expect(dir.files["references/guide.md"]).toContain("Setup & Configuration Guide");
    });

    it("always produces references/examples.md", () => {
      const tool = makeMockTool();
      const dir = generateSkillDirectory(tool);
      expect(dir.files["references/examples.md"]).toBeDefined();
      expect(dir.files["references/examples.md"]).toContain("Common Usage Patterns");
    });

    it("always produces references/troubleshooting.md", () => {
      const tool = makeMockTool();
      const dir = generateSkillDirectory(tool);
      expect(dir.files["references/troubleshooting.md"]).toBeDefined();
      expect(dir.files["references/troubleshooting.md"]).toContain("Troubleshooting");
    });

    it("always produces scripts/install.sh", () => {
      const tool = makeMockTool();
      const dir = generateSkillDirectory(tool);
      expect(dir.files["scripts/install.sh"]).toBeDefined();
      expect(dir.files["scripts/install.sh"]).toContain("uv tool install");
    });

    it("always produces scripts/validate.py", () => {
      const tool = makeMockTool();
      const dir = generateSkillDirectory(tool);
      expect(dir.files["scripts/validate.py"]).toBeDefined();
      expect(dir.files["scripts/validate.py"]).toContain("uv run");
    });

    it("produces references/commands.md when commands exist", () => {
      const tool = makeMockTool();
      const dir = generateSkillDirectory(tool);
      expect(dir.files["references/commands.md"]).toBeDefined();
      expect(dir.files["references/commands.md"]).toContain("Full Command Reference");
    });

    it("SKILL.md has References section with links", () => {
      const tool = makeMockTool();
      const dir = generateSkillDirectory(tool);
      expect(dir.skillMd).toContain("## References");
      expect(dir.skillMd).toContain("[Guide](references/guide.md)");
      expect(dir.skillMd).toContain("[Examples](references/examples.md)");
      expect(dir.skillMd).toContain("[Troubleshooting](references/troubleshooting.md)");
    });

    it("SKILL.md has Scripts section", () => {
      const tool = makeMockTool();
      const dir = generateSkillDirectory(tool);
      expect(dir.skillMd).toContain("## Scripts");
      expect(dir.skillMd).toContain("scripts/install.sh");
      expect(dir.skillMd).toContain("scripts/validate.py");
    });

    it("SKILL.md does NOT inline Common Patterns or Troubleshooting", () => {
      const tool = makeMockTool();
      const dir = generateSkillDirectory(tool);
      expect(dir.skillMd).not.toContain("## Common Patterns");
      expect(dir.skillMd).not.toContain("## Troubleshooting");
    });
  });

  describe("quality gate integration", () => {
    it("generated skill passes testSkillSync with trigger >= 0.80 and quality >= 6", () => {
      const tool = makeMockTool();
      const md = generateRichSkillMd(tool);
      const result = testSkillSync("inline", md);
      expect(result.triggerScore).toBeGreaterThanOrEqual(0.80);
      expect(result.qualityScore).toBeGreaterThanOrEqual(6);
      expect(result.passed).toBe(true);
    });

    it("tool without commands also passes quality gate", () => {
      const tool = makeMockTool({
        capabilities: { commands: [], globalFlags: [], analysisMethod: "help-probe" },
      });
      const md = generateRichSkillMd(tool);
      const result = testSkillSync("inline", md);
      expect(result.triggerScore).toBeGreaterThanOrEqual(0.80);
      expect(result.qualityScore).toBeGreaterThanOrEqual(6);
      expect(result.passed).toBe(true);
    });
  });

  describe("source format coverage", () => {
    it("npm tool gets correct install script and compatibility", () => {
      const tool = makeMockTool({
        source: { format: "npm", uri: "npm:express" },
        meta: { ...makeMockTool().meta, name: "express" },
      });
      const dir = generateSkillDirectory(tool);
      expect(dir.files["scripts/install.sh"]).toContain("npm install -g");
      expect(dir.skillMd).toContain('compatibility: "Node.js v18+"');
    });

    it("crates tool gets correct install script and compatibility", () => {
      const tool = makeMockTool({
        source: { format: "crates", uri: "crates:ripgrep" },
        meta: { ...makeMockTool().meta, name: "ripgrep" },
      });
      const dir = generateSkillDirectory(tool);
      expect(dir.files["scripts/install.sh"]).toContain("cargo binstall");
      expect(dir.skillMd).toContain('compatibility: "Rust toolchain"');
    });

    it("github tool gets language-aware install script", () => {
      // Rust tool detected by tags
      const rustTool = makeMockTool({
        source: { format: "github", uri: "BurntSushi/ripgrep" },
        meta: { ...makeMockTool().meta, name: "ripgrep", tags: ["rust", "cli"] },
      });
      const rustDir = generateSkillDirectory(rustTool);
      expect(rustDir.files["scripts/install.sh"]).toContain("cargo");

      // Unknown language falls back to releases/brew
      const unknownTool = makeMockTool({
        source: { format: "github", uri: "astral-sh/uv" },
        meta: { ...makeMockTool().meta, name: "uv", tags: [] },
      });
      const unknownDir = generateSkillDirectory(unknownTool);
      expect(unknownDir.files["scripts/install.sh"]).toContain("releases");
    });
  });
});

// =============================================================================
// scoreTrigger
// =============================================================================

describe("scoreTrigger", () => {
  it("gives +0.3 for 'Use when' prefix", () => {
    const score = scoreTrigger("Use when running tests");
    expect(score).toBeGreaterThanOrEqual(0.3);
  });

  it("gives +0.2 for 'Do NOT use for' clause", () => {
    const score = scoreTrigger("Use when running tests. Do NOT use for deployment");
    expect(score).toBeGreaterThanOrEqual(0.5);
  });

  it("recognizes new action verbs (fine-tuning, inferencing, vectorizing)", () => {
    const s1 = scoreTrigger("Use when fine-tuning models, inferencing data, vectorizing embeddings");
    expect(s1).toBeGreaterThanOrEqual(0.7); // 0.3 + 0.4 (3 verbs)
  });

  it("recognizes annotating, labeling, quantizing, serving", () => {
    const s = scoreTrigger("Use when annotating, labeling, quantizing, serving");
    expect(s).toBeGreaterThanOrEqual(0.7);
  });

  it("recognizes evaluating, benchmarking, augmenting, automating", () => {
    const s = scoreTrigger("Use when evaluating, benchmarking, augmenting, automating");
    expect(s).toBeGreaterThanOrEqual(0.7);
  });

  it("recognizes importing, integrating, invoking", () => {
    const s = scoreTrigger("Use when importing modules, integrating APIs, invoking commands");
    expect(s).toBeGreaterThanOrEqual(0.7);
  });

  it("gives +0.1 for comma-separated triggers", () => {
    const withCommas = scoreTrigger("Use when running tests, building projects, deploying apps.");
    const withoutCommas = scoreTrigger("Use when running tests.");
    expect(withCommas).toBeGreaterThan(withoutCommas);
  });

  it("gives +0.1 for 2+ TechNames", () => {
    const with2 = scoreTrigger("Use when running Python Docker tests");
    const with0 = scoreTrigger("Use when running tests and doing things");
    expect(with2).toBeGreaterThan(with0);
  });

  it("handles descriptions without trailing dot (C2 fix)", () => {
    const score = scoreTrigger("Use when running tools, building apps Do NOT use for deployment");
    // Should still get comma-trigger bonus
    expect(score).toBeGreaterThanOrEqual(0.8);
  });

  it("clamps at 1.0", () => {
    const score = scoreTrigger(
      "Use when running tests, building projects, deploying apps. Do NOT use for database. Python Docker Kubernetes"
    );
    expect(score).toBeLessThanOrEqual(1.0);
  });
});

// =============================================================================
// domainMatches
// =============================================================================

describe("domainMatches", () => {
  const makeContent = (domain: string) => `---\ndomain: ${domain}\n---\n# Test`;

  it("matches exact domain", () => {
    expect(domainMatches(makeContent("database"), "database")).toBe(true);
  });

  it("matches substring in domain (filter in domain)", () => {
    expect(domainMatches(makeContent("ai-ml/ai-agents"), "agent")).toBe(true);
  });

  it("does NOT match reverse direction (C3 fix: domain substring of filter)", () => {
    // "database-tools".includes("data") was true before fix — should be false
    expect(domainMatches(makeContent("data"), "database-tools")).toBe(false);
  });

  it("returns false when no domain field", () => {
    expect(domainMatches("---\nname: test\n---\n# Test", "agent")).toBe(false);
  });

  it("handles quoted domain values", () => {
    expect(domainMatches('---\ndomain: "ai-ml/agents"\n---\n', "agent")).toBe(true);
  });
});

// =============================================================================
// isLikelyCli
// =============================================================================

describe("isLikelyCli", () => {
  it("returns true for tools with commands", () => {
    const tool = makeMockTool({
      capabilities: { commands: [{ name: "check", description: "Run checks" }], globalFlags: [] },
      meta: { ...makeMockTool().meta, tags: [] },
    });
    expect(isLikelyCli(tool)).toBe(true);
  });

  it("returns true for tools with CLI tags", () => {
    const tool = makeMockTool({
      meta: { ...makeMockTool().meta, tags: ["cli", "tool"] },
    });
    expect(isLikelyCli(tool)).toBe(true);
  });

  it("returns true for dual-purpose tools with library tag AND commands (C4 fix)", () => {
    const tool = makeMockTool({
      capabilities: { commands: [{ name: "check", description: "Lint check" }], globalFlags: [] },
      meta: { ...makeMockTool().meta, tags: ["library", "python"] },
    });
    expect(isLikelyCli(tool)).toBe(true);
  });

  it("returns false for pure library with no commands", () => {
    const tool = makeMockTool({
      capabilities: { commands: [], globalFlags: [] },
      meta: { ...makeMockTool().meta, name: "requests", tags: ["library", "python"], description: "HTTP library for Python" },
    });
    expect(isLikelyCli(tool)).toBe(false);
  });
});

// =============================================================================
// inferLibraryInstallCommand
// =============================================================================

describe("inferLibraryInstallCommand", () => {
  it("generates npm install for npm packages", () => {
    const tool = makeMockTool({ source: { format: "npm", uri: "npm:express" } });
    const cmd = inferLibraryInstallCommand(tool);
    expect(cmd).toContain("npm install");
    expect(cmd).toContain("express");
  });

  it("generates pip install for pypi packages", () => {
    const tool = makeMockTool({ source: { format: "pypi", uri: "pypi:requests" } });
    const cmd = inferLibraryInstallCommand(tool);
    expect(cmd).toContain("pip install");
    expect(cmd).toContain("requests");
  });

  it("generates cargo add for crates", () => {
    const tool = makeMockTool({ source: { format: "crates", uri: "crates:serde" } });
    const cmd = inferLibraryInstallCommand(tool);
    expect(cmd).toContain("cargo add");
    expect(cmd).toContain("serde");
  });

  it("uses shellQuote on package names (S2 fix)", () => {
    const tool = makeMockTool({ source: { format: "npm", uri: "npm:@scope/pkg" } });
    const cmd = inferLibraryInstallCommand(tool);
    // shellQuote wraps in single quotes
    expect(cmd).toContain("'@scope/pkg'");
  });
});

// =============================================================================
// refineCategoryKey — template bleed prevention
// =============================================================================

describe("refineCategoryKey via buildDescription", () => {
  it("generates testing triggers for pytest-like tools, not linting", () => {
    const tool = makeMockTool({
      meta: { name: "pytest", version: "7.0.0", description: "pytest: simple powerful testing with Python", tags: ["python", "testing"] },
      source: { format: "pypi", uri: "pypi:pytest" },
      capabilities: { commands: [], globalFlags: [], analysisMethod: "help-probe" },
    });
    (tool as { _curatedMeta: typeof tool._curatedMeta })._curatedMeta = {
      description: "Python testing framework",
      agentValue: "Run tests, fixtures, assertions",
      category: "python",
    };
    const md = generateRichSkillMd(tool);
    const desc = md.match(/^description:\s*"?(.+?)"?\s*$/m)?.[1] ?? "";
    // Should NOT mention "linting and formatting"
    expect(desc.toLowerCase()).not.toContain("linting and formatting");
    // Should mention testing-related verbs
    expect(desc.toLowerCase()).toMatch(/test|assert|fixture|running tests/);
  });

  it("generates ML triggers for gradio-like tools", () => {
    const tool = makeMockTool({
      meta: { name: "gradio", version: "4.0.0", description: "Build & share delightful machine learning apps", tags: ["python", "ml"] },
      source: { format: "pypi", uri: "pypi:gradio" },
      capabilities: { commands: [], globalFlags: [], analysisMethod: "help-probe" },
    });
    (tool as { _curatedMeta: typeof tool._curatedMeta })._curatedMeta = {
      description: "Machine learning web interfaces",
      agentValue: "Build ML model demos and interfaces",
      category: "python",
    };
    const md = generateRichSkillMd(tool);
    const desc = md.match(/^description:\s*"?(.+?)"?\s*$/m)?.[1] ?? "";
    expect(desc.toLowerCase()).not.toContain("linting and formatting");
  });
});

// =============================================================================
// _toolKind in generateRichSkillMd
// =============================================================================

describe("_toolKind", () => {
  it("library tools get library tag", () => {
    const tool = makeMockTool({
      meta: { name: "numpy", version: "1.0.0", description: "Fundamental package for array computing", tags: ["python"] },
      source: { format: "pypi", uri: "pypi:numpy" },
      capabilities: { commands: [], globalFlags: [], analysisMethod: "help-probe" },
    });
    (tool as { _toolKind?: string })._toolKind = "library";
    const md = generateRichSkillMd(tool);
    expect(md).toContain("library");
  });

  it("CLI tools get cli-tool tag", () => {
    const tool = makeMockTool({
      meta: { name: "ruff", version: "0.1.0", description: "An extremely fast Python linter", tags: ["python"] },
      source: { format: "pypi", uri: "pypi:ruff" },
      capabilities: {
        commands: [{ name: "check", description: "Run linting checks", flags: [] }],
        globalFlags: [],
        analysisMethod: "flag-parse",
      },
    });
    (tool as { _toolKind?: string })._toolKind = "cli";
    const md = generateRichSkillMd(tool);
    expect(md).toContain("cli-tool");
  });
});

// =============================================================================
// Command names as tags
// =============================================================================

describe("command names as tags", () => {
  it("adds command names to tags for tools with 5+ commands", () => {
    const commands = ["check", "format", "clean", "rule", "linter", "config", "version"].map(
      name => ({ name, description: `${name} command`, flags: [] as readonly import("../lib/types.js").ToolFlag[] })
    );
    const tool = makeMockTool({
      meta: { name: "ruff", version: "0.1.0", description: "An extremely fast Python linter", tags: ["python", "linter"] },
      source: { format: "pypi", uri: "pypi:ruff" },
      capabilities: { commands, globalFlags: [], analysisMethod: "flag-parse" },
    });
    const md = generateRichSkillMd(tool);
    // Should contain at least some command names as tags
    expect(md).toContain("  - check");
    expect(md).toContain("  - format");
  });

  it("does not add command tags for tools with fewer than 5 commands", () => {
    const commands = [{ name: "run", description: "Run stuff", flags: [] as readonly import("../lib/types.js").ToolFlag[] }];
    const tool = makeMockTool({
      meta: { name: "mytool", version: "1.0.0", description: "A simple tool", tags: ["tool"] },
      source: { format: "npm", uri: "npm:mytool" },
      capabilities: { commands, globalFlags: [], analysisMethod: "flag-parse" },
    });
    const md = generateRichSkillMd(tool);
    // "run" should NOT appear as a tag since we only have 1 command
    const tagSection = md.split("tags:")[1]?.split("---")[0] ?? "";
    const tagLines = tagSection.split("\n").filter(l => l.trim().startsWith("- "));
    expect(tagLines.some(l => l.trim() === "- run")).toBe(false);
  });
});

// =============================================================================
// scoreContentQuality
// =============================================================================

describe("scoreContentQuality", () => {
  it("scores clean skill content high", () => {
    const content = `---
name: ruff
description: "Fast Python linter. Use when linting code."
---

## Quick Start

\`\`\`bash
ruff check .
\`\`\`

## Commands

\`\`\`bash
ruff format .
\`\`\`
`;
    const result = scoreContentQuality(content);
    expect(result.score).toBeGreaterThanOrEqual(8);
    expect(result.issues).toHaveLength(0);
  });

  it("penalizes fabricated Client() pattern", () => {
    const content = `---
name: mylib
description: "A library"
---

## Quick Start

\`\`\`python
import mylib
client = mylib.Client()
\`\`\`
`;
    const result = scoreContentQuality(content);
    expect(result.score).toBeLessThan(8);
    expect(result.issues.some(i => i.includes("Client()"))).toBe(true);
  });

  it("penalizes few code examples", () => {
    const content = `---
name: bare
description: "Minimal"
---

## About

Just text, no code.
`;
    const result = scoreContentQuality(content);
    expect(result.score).toBeLessThan(9);
    expect(result.issues.some(i => i.includes("code examples"))).toBe(true);
  });
});

// =============================================================================
// extractCommandsFromReadme with binaryNames
// =============================================================================

describe("extractCommandsFromReadme with binaryNames", () => {
  it("finds commands using binary name alias", () => {
    const readme = `
# Usage

\`\`\`bash
rg search-pattern path/
rg --type js "import"
\`\`\`
`;
    // Tool name is "ripgrep" but binary is "rg"
    const cmds = extractCommandsFromReadme(readme, "ripgrep", ["rg"]);
    expect(cmds.length).toBeGreaterThan(0);
    expect(cmds[0]!.name).toBe("search-pattern");
  });

  it("finds commands with both tool name and binary names", () => {
    const readme = `
\`\`\`bash
# Using full name
ripgrep search-pattern
# Using binary
rg --files
\`\`\`
`;
    const cmds = extractCommandsFromReadme(readme, "ripgrep", ["rg"]);
    expect(cmds.some(c => c.name === "search-pattern")).toBe(true);
  });

  it("deduplicates commands found with different names", () => {
    const readme = `
\`\`\`bash
mytool check foo
mt check bar
\`\`\`
`;
    const cmds = extractCommandsFromReadme(readme, "mytool", ["mt"]);
    const checkCmds = cmds.filter(c => c.name === "check");
    expect(checkCmds).toHaveLength(1);
  });
});

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
} from "../lib/skills.js";
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
    expect(md).toContain("Use this skill whenever");
  });

  it("includes usage section", () => {
    const md = generateSkillMd("usage-test", "Testing usage");
    expect(md).toContain("## Usage");
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

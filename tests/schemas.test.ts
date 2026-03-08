import { describe, it, expect } from "vitest";
import {
  toolSourceSchema,
  toolFlagSchema,
  toolCommandSchema,
  toolMetaSchema,
  toolSchema,
  storeQuerySchema,
  registryEntrySchema,
  skillFrontmatterSchema,
  lockfileSchema,
  cliConfigSchema,
  guardConfigSchema,
  sourceFormatSchema,
  installStatusSchema,
} from "../lib/schemas.js";

describe("sourceFormatSchema", () => {
  it("accepts valid formats", () => {
    for (const fmt of ["github", "npm", "pypi", "local", "url", "git", "tarball"]) {
      expect(sourceFormatSchema.parse(fmt)).toBe(fmt);
    }
  });

  it("rejects invalid formats", () => {
    expect(() => sourceFormatSchema.parse("invalid")).toThrow();
  });
});

describe("installStatusSchema", () => {
  it("accepts valid statuses", () => {
    for (const s of ["installed", "pending", "failed", "outdated"]) {
      expect(installStatusSchema.parse(s)).toBe(s);
    }
  });
});

describe("toolSourceSchema", () => {
  it("validates a valid source", () => {
    const source = { format: "github", uri: "owner/repo" };
    expect(toolSourceSchema.parse(source)).toEqual(source);
  });

  it("accepts optional ref and subpath", () => {
    const source = { format: "npm", uri: "@scope/pkg", ref: "v1.0.0", subpath: "bin" };
    expect(toolSourceSchema.parse(source)).toEqual(source);
  });

  it("rejects empty uri", () => {
    expect(() => toolSourceSchema.parse({ format: "github", uri: "" })).toThrow();
  });
});

describe("toolFlagSchema", () => {
  it("validates a boolean flag", () => {
    const flag = {
      name: "--verbose",
      description: "Enable verbose output",
      type: "boolean" as const,
      required: false,
    };
    expect(toolFlagSchema.parse(flag)).toEqual(flag);
  });

  it("accepts optional alias and defaultValue", () => {
    const flag = {
      name: "--output",
      alias: "-o",
      description: "Output file",
      type: "string" as const,
      required: true,
      defaultValue: "stdout",
    };
    expect(toolFlagSchema.parse(flag)).toEqual(flag);
  });
});

describe("toolCommandSchema", () => {
  it("validates a command with flags", () => {
    const cmd = {
      name: "install",
      description: "Install a package",
      flags: [
        { name: "--global", description: "Install globally", type: "boolean", required: false },
      ],
    };
    expect(toolCommandSchema.parse(cmd)).toEqual(cmd);
  });
});

describe("toolMetaSchema", () => {
  it("validates complete metadata", () => {
    const meta = {
      name: "my-tool",
      version: "1.0.0",
      description: "A test tool",
      homepage: "https://example.com",
      license: "MIT",
      tags: ["testing", "cli"],
    };
    expect(toolMetaSchema.parse(meta)).toEqual(meta);
  });

  it("rejects empty name", () => {
    expect(() =>
      toolMetaSchema.parse({ name: "", version: "1.0", description: "", tags: [] }),
    ).toThrow();
  });
});

describe("toolSchema", () => {
  it("validates a full tool object", () => {
    const tool = {
      id: "my-tool",
      meta: {
        name: "my-tool",
        version: "1.0.0",
        description: "Test",
        tags: [],
      },
      source: { format: "github", uri: "owner/repo" },
      capabilities: {
        commands: [],
        globalFlags: [],
        analysisMethod: "help-probe",
      },
      installPath: "/usr/local/bin/my-tool",
      status: "installed",
      installedAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(toolSchema.parse(tool)).toEqual(tool);
  });
});

describe("storeQuerySchema", () => {
  it("accepts empty query", () => {
    expect(storeQuerySchema.parse({})).toEqual({});
  });

  it("validates full query", () => {
    const query = { text: "search", tags: ["cli"], status: "installed", limit: 10, offset: 0 };
    expect(storeQuerySchema.parse(query)).toEqual(query);
  });
});

describe("registryEntrySchema", () => {
  it("validates a registry entry", () => {
    const entry = {
      id: "tool-1",
      meta: { name: "tool-1", version: "1.0.0", description: "Test", tags: [] },
      source: { format: "github", uri: "owner/tool-1" },
      layer: "community",
      verified: true,
      downloads: 100,
    };
    expect(registryEntrySchema.parse(entry)).toEqual(entry);
  });
});

describe("skillFrontmatterSchema", () => {
  it("validates skill frontmatter", () => {
    const fm = {
      name: "web-scraper",
      version: "0.1.0",
      description: "Scrape websites",
      ingredients: ["curl", "jq"],
      tags: ["web"],
    };
    expect(skillFrontmatterSchema.parse(fm)).toEqual(fm);
  });
});

describe("lockfileSchema", () => {
  it("validates a lockfile", () => {
    const lock = {
      version: 1,
      entries: [
        {
          id: "tool-1",
          version: "1.0.0",
          source: { format: "npm", uri: "tool-1" },
          integrity: "sha256-abc123",
        },
      ],
      generatedAt: "2026-01-01T00:00:00Z",
    };
    expect(lockfileSchema.parse(lock)).toEqual(lock);
  });

  it("rejects wrong version", () => {
    expect(() =>
      lockfileSchema.parse({ version: 2, entries: [], generatedAt: "2026-01-01T00:00:00Z" }),
    ).toThrow();
  });
});

describe("cliConfigSchema", () => {
  it("validates minimal config", () => {
    const config = { dataDir: "/home/.agents-cli", cacheDir: "/tmp/agents-cli" };
    expect(cliConfigSchema.parse(config)).toEqual(config);
  });

  it("validates config with LLM settings", () => {
    const config = {
      dataDir: "/data",
      cacheDir: "/cache",
      registryUrl: "https://registry.example.com",
      llm: { provider: "anthropic", model: "claude-sonnet-4-6" },
    };
    expect(cliConfigSchema.parse(config)).toEqual(config);
  });
});

describe("guardConfigSchema", () => {
  it("validates guard config", () => {
    const guard = { type: "path-traversal", enabled: true };
    expect(guardConfigSchema.parse(guard)).toEqual(guard);
  });

  it("accepts options map", () => {
    const guard = {
      type: "size-limit",
      enabled: true,
      options: { maxBytes: 1048576 },
    };
    expect(guardConfigSchema.parse(guard)).toEqual(guard);
  });
});

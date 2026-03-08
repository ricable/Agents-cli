import { describe, it, expect } from "vitest";
import { detectFormat, createResolver, parseCratesPackage } from "../lib/resolver.js";
import { createInstaller } from "../lib/installer.js";

describe("detectFormat — crates", () => {
  it("detects crates: prefix", () => {
    expect(detectFormat("crates:ripgrep")).toBe("crates");
    expect(detectFormat("crates:bat")).toBe("crates");
    expect(detectFormat("crates:fd-find")).toBe("crates");
  });

  it("does not confuse crates: with other formats", () => {
    expect(detectFormat("owner/repo")).toBe("github");
    expect(detectFormat("@scope/pkg")).toBe("npm");
    expect(detectFormat("pypi:ruff")).toBe("pypi");
    expect(detectFormat("./local")).toBe("local");
  });
});

describe("parseCratesPackage", () => {
  it("strips crates: prefix and returns crate name", () => {
    expect(parseCratesPackage("crates:ripgrep")).toBe("ripgrep");
    expect(parseCratesPackage("crates:bat")).toBe("bat");
    expect(parseCratesPackage("crates:fd-find")).toBe("fd-find");
  });

  it("accepts names with underscores and hyphens", () => {
    expect(parseCratesPackage("crates:my_crate")).toBe("my_crate");
    expect(parseCratesPackage("crates:my-crate")).toBe("my-crate");
  });

  it("rejects path traversal attempts", () => {
    expect(() => parseCratesPackage("crates:../evil")).toThrow("Invalid crate name");
  });

  it("rejects empty crate name", () => {
    expect(() => parseCratesPackage("crates:")).toThrow("Invalid crate name");
  });

  it("rejects names with slashes", () => {
    expect(() => parseCratesPackage("crates:foo/bar")).toThrow("Invalid crate name");
  });

  it("rejects names with spaces", () => {
    expect(() => parseCratesPackage("crates:foo bar")).toThrow("Invalid crate name");
  });

  it("rejects names starting with a number", () => {
    expect(() => parseCratesPackage("crates:123abc")).toThrow("Invalid crate name");
  });
});

describe("createResolver — crates", () => {
  const resolver = createResolver();

  it("supports crates: inputs", () => {
    expect(resolver.supports("crates:ripgrep")).toBe(true);
    expect(resolver.supports("crates:bat")).toBe(true);
  });

  it("resolves a crates source format", async () => {
    const result = await resolver.resolve("crates:ripgrep");
    expect(result.source.format).toBe("crates");
    expect(result.source.uri).toBe("crates:ripgrep");
  });
});

describe("createInstaller — crates", () => {
  const installer = createInstaller();

  it("supports crates format", () => {
    expect(installer.supports("crates")).toBe(true);
  });

  it("still supports existing formats", () => {
    expect(installer.supports("github")).toBe(true);
    expect(installer.supports("npm")).toBe(true);
    expect(installer.supports("pypi")).toBe(true);
    expect(installer.supports("local")).toBe(true);
  });
});

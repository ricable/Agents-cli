import { describe, it, expect } from "vitest";
import { detectFormat, createResolver, parsePypiPackage, normalizePypiLicense } from "../lib/resolver.js";
import { createInstaller } from "../lib/installer.js";

describe("detectFormat — pypi", () => {
  it("detects pypi: prefix", () => {
    expect(detectFormat("pypi:ruff")).toBe("pypi");
    expect(detectFormat("pypi:httpie")).toBe("pypi");
    expect(detectFormat("pypi:black")).toBe("pypi");
  });

  it("does not confuse pypi: with other formats", () => {
    expect(detectFormat("owner/repo")).toBe("github");
    expect(detectFormat("@scope/pkg")).toBe("npm");
    expect(detectFormat("./local")).toBe("local");
  });

  it("pypi: takes precedence over other patterns", () => {
    // Even though pypi:foo/bar could match github, pypi: is checked first
    expect(detectFormat("pypi:some-tool")).toBe("pypi");
  });
});

describe("parsePypiPackage", () => {
  it("strips pypi: prefix and returns package name", () => {
    expect(parsePypiPackage("pypi:ruff")).toBe("ruff");
    expect(parsePypiPackage("pypi:my-tool")).toBe("my-tool");
    expect(parsePypiPackage("pypi:tool123")).toBe("tool123");
  });

  it("accepts packages with dots and underscores", () => {
    expect(parsePypiPackage("pypi:my.tool")).toBe("my.tool");
    expect(parsePypiPackage("pypi:my_tool")).toBe("my_tool");
  });

  it("rejects path traversal attempts", () => {
    expect(() => parsePypiPackage("pypi:../evil")).toThrow("Invalid PyPI package name");
  });

  it("rejects empty package name", () => {
    expect(() => parsePypiPackage("pypi:")).toThrow("Invalid PyPI package name");
  });

  it("rejects names with slashes", () => {
    expect(() => parsePypiPackage("pypi:foo/bar")).toThrow("Invalid PyPI package name");
  });

  it("rejects names with spaces", () => {
    expect(() => parsePypiPackage("pypi:foo bar")).toThrow("Invalid PyPI package name");
  });
});

describe("createResolver — pypi", () => {
  const resolver = createResolver();

  it("supports pypi: inputs", () => {
    expect(resolver.supports("pypi:ruff")).toBe(true);
    expect(resolver.supports("pypi:httpie")).toBe(true);
  });

  it("resolves a pypi source format", async () => {
    const result = await resolver.resolve("pypi:ruff");
    expect(result.source.format).toBe("pypi");
    expect(result.source.uri).toBe("pypi:ruff");
  });
});

describe("createInstaller — pypi", () => {
  const installer = createInstaller();

  it("supports pypi format", () => {
    expect(installer.supports("pypi")).toBe(true);
  });

  it("still supports existing formats", () => {
    expect(installer.supports("github")).toBe(true);
    expect(installer.supports("npm")).toBe(true);
    expect(installer.supports("local")).toBe(true);
  });
});

describe("normalizePypiLicense", () => {
  it("returns short SPDX identifiers unchanged", () => {
    expect(normalizePypiLicense("MIT", [])).toBe("MIT");
    expect(normalizePypiLicense("Apache-2.0", [])).toBe("Apache-2.0");
    expect(normalizePypiLicense("BSD-3-Clause", [])).toBe("BSD-3-Clause");
  });

  it("extracts identifier from full MIT license text", () => {
    const fullMit = `MIT License

Copyright (c) 2024 Example

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files.`;
    expect(normalizePypiLicense(fullMit, [])).toBe("MIT");
  });

  it("extracts identifier from full Apache license text", () => {
    const fullApache = `Apache License
Version 2.0, January 2004

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION. You may not use this file except in compliance with the License.`;
    expect(normalizePypiLicense(fullApache, [])).toBe("Apache-2.0");
  });

  it("falls back to trove classifiers when license text is long", () => {
    const longText = "x".repeat(100);
    const classifiers = ["License :: OSI Approved :: MIT License"];
    expect(normalizePypiLicense(longText, classifiers)).toBe("MIT");
  });

  it("normalizes classifier names", () => {
    expect(normalizePypiLicense("", ["License :: OSI Approved :: Apache Software License"])).toBe("Apache-2.0");
    expect(normalizePypiLicense("", ["License :: OSI Approved :: BSD License"])).toBe("BSD-3-Clause");
  });

  it("returns undefined for empty/missing license", () => {
    expect(normalizePypiLicense("", [])).toBeUndefined();
    expect(normalizePypiLicense(null, [])).toBeUndefined();
    expect(normalizePypiLicense(undefined, [])).toBeUndefined();
  });
});

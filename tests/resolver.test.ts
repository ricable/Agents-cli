import { describe, it, expect } from "vitest";
import { detectFormat, createResolver } from "../lib/resolver.js";

describe("detectFormat", () => {
  it("detects GitHub owner/repo format", () => {
    expect(detectFormat("owner/repo")).toBe("github");
  });

  it("detects GitHub URL format", () => {
    expect(detectFormat("https://github.com/owner/repo")).toBe("github");
  });

  it("detects tarball URL", () => {
    expect(detectFormat("https://example.com/tool.tar.gz")).toBe("tarball");
    expect(detectFormat("https://example.com/tool.tgz")).toBe("tarball");
  });

  it("detects generic URL", () => {
    expect(detectFormat("https://example.com/tool")).toBe("url");
  });

  it("detects git+https", () => {
    expect(detectFormat("git+https://github.com/owner/repo.git")).toBe("git");
  });

  it("detects local paths", () => {
    expect(detectFormat("./my-tool")).toBe("local");
    expect(detectFormat("/usr/local/bin/tool")).toBe("local");
    expect(detectFormat("~/tools/my-tool")).toBe("local");
  });

  it("detects npm scoped packages", () => {
    expect(detectFormat("@claude-flow/cli")).toBe("npm");
    expect(detectFormat("@ruvnet/bmssp")).toBe("npm");
  });

  it("returns null for unrecognized input", () => {
    expect(detectFormat("just-a-name")).toBeNull();
  });
});

describe("createResolver", () => {
  const resolver = createResolver();

  it("supports known formats", () => {
    expect(resolver.supports("owner/repo")).toBe(true);
    expect(resolver.supports("./local-tool")).toBe(true);
  });

  it("does not support unrecognized input", () => {
    expect(resolver.supports("bare-name")).toBe(false);
  });

  it("resolves a GitHub source", async () => {
    const result = await resolver.resolve("owner/repo");
    expect(result.source.format).toBe("github");
    expect(result.source.uri).toBe("owner/repo");
  });

  it("throws on unrecognized input", async () => {
    await expect(resolver.resolve("bare-name")).rejects.toThrow(
      "Cannot resolve source format",
    );
  });
});

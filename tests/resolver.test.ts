import { describe, it, expect } from "vitest";
import { detectFormat, createResolver, parseGithubOwnerRepo } from "../lib/resolver.js";

describe("detectFormat", () => {
  it("detects GitHub owner/repo format", () => {
    expect(detectFormat("owner/repo")).toBe("github");
  });

  it("detects GitHub URL format", () => {
    expect(detectFormat("https://github.com/owner/repo")).toBe("github");
  });

  it("returns null for non-GitHub URLs", () => {
    expect(detectFormat("https://example.com/tool.tar.gz")).toBeNull();
    expect(detectFormat("https://example.com/tool")).toBeNull();
  });

  it("returns null for git+https", () => {
    expect(detectFormat("git+https://github.com/owner/repo.git")).toBeNull();
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

  it("resolves a local source (no network)", async () => {
    const result = await resolver.resolve("./my-tool");
    expect(result.source.format).toBe("local");
    expect(result.source.uri).toBe("./my-tool");
  });

  it("throws on unrecognized input", async () => {
    await expect(resolver.resolve("bare-name")).rejects.toThrow(
      "Cannot resolve source format",
    );
  });
});

describe("parseGithubOwnerRepo", () => {
  it("parses owner/repo shorthand", () => {
    expect(parseGithubOwnerRepo("ruvnet/ruflo")).toEqual({ owner: "ruvnet", repo: "ruflo" });
  });

  it("parses GitHub URL", () => {
    expect(parseGithubOwnerRepo("https://github.com/ruvnet/agentic-flow")).toEqual({
      owner: "ruvnet",
      repo: "agentic-flow",
    });
  });

  it("handles .git suffix", () => {
    expect(parseGithubOwnerRepo("https://github.com/ruvnet/ruflo.git")).toEqual({
      owner: "ruvnet",
      repo: "ruflo",
    });
  });

  it("returns null for invalid input", () => {
    expect(parseGithubOwnerRepo("just-a-name")).toBeNull();
  });
});

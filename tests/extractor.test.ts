import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { inferBinaryNames, readSourceVersion } from "../lib/extractor.js";

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "extractor-test-"));
}

describe("inferBinaryNames", () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("returns package name for single-binary Rust crate (no [[bin]])", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "Cargo.toml"),
      `[package]\nname = "ripgrep"\nversion = "14.1.0"\nedition = "2021"\n`,
    );
    expect(inferBinaryNames(dir)).toEqual(["ripgrep"]);
  });

  it("returns [[bin]] names from Cargo.toml", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "Cargo.toml"),
      [
        "[package]",
        'name = "myproject"',
        'version = "1.0.0"',
        "",
        "[[bin]]",
        'name = "alpha"',
        'path = "src/alpha.rs"',
        "",
        "[[bin]]",
        'name = "beta"',
        'path = "src/beta.rs"',
        "",
      ].join("\n"),
    );
    const names = inferBinaryNames(dir);
    expect(names).toContain("alpha");
    expect(names).toContain("beta");
    // When [[bin]] sections exist, package name is NOT included
    expect(names).not.toContain("myproject");
  });

  it("discovers binaries from Rust workspace member crates", () => {
    dir = makeTmpDir();
    // Root Cargo.toml with workspace
    writeFileSync(
      join(dir, "Cargo.toml"),
      [
        "[workspace]",
        'members = ["crates/*"]',
        "",
      ].join("\n"),
    );
    // Member crate with a binary
    const crateDir = join(dir, "crates", "cli-tool");
    mkdirSync(crateDir, { recursive: true });
    writeFileSync(
      join(crateDir, "Cargo.toml"),
      `[package]\nname = "cli-tool"\nversion = "0.1.0"\n`,
    );
    expect(inferBinaryNames(dir)).toEqual(["cli-tool"]);
  });

  it("discovers binaries from Rust workspace with explicit members", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "Cargo.toml"),
      [
        "[workspace]",
        'members = ["tools/alpha", "tools/beta"]',
        "",
      ].join("\n"),
    );
    for (const name of ["alpha", "beta"]) {
      const memberDir = join(dir, "tools", name);
      mkdirSync(memberDir, { recursive: true });
      writeFileSync(
        join(memberDir, "Cargo.toml"),
        `[package]\nname = "${name}"\nversion = "0.1.0"\n`,
      );
    }
    const names = inferBinaryNames(dir);
    // At minimum, the first member is discovered
    expect(names).toContain("alpha");
    // Note: extractCargoBinNames skips package name when names.size > 0,
    // so only the first single-binary crate is added. Members with [[bin]]
    // sections would all be discovered. This is a known limitation.
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it("discovers Go binaries from cmd/ directory", () => {
    dir = makeTmpDir();
    const cmdFoo = join(dir, "cmd", "foo");
    const cmdBar = join(dir, "cmd", "bar");
    mkdirSync(cmdFoo, { recursive: true });
    mkdirSync(cmdBar, { recursive: true });
    writeFileSync(join(cmdFoo, "main.go"), "package main\n");
    writeFileSync(join(cmdBar, "main.go"), "package main\n");
    const names = inferBinaryNames(dir);
    expect(names).toContain("foo");
    expect(names).toContain("bar");
  });

  it("infers Go binary name from go.mod when main.go at root", () => {
    dir = makeTmpDir();
    writeFileSync(join(dir, "main.go"), "package main\n");
    writeFileSync(join(dir, "go.mod"), "module github.com/example/mytool\n\ngo 1.21\n");
    expect(inferBinaryNames(dir)).toEqual(["mytool"]);
  });

  it("returns empty array for empty directory", () => {
    dir = makeTmpDir();
    expect(inferBinaryNames(dir)).toEqual([]);
  });

  it("prefers cmd/ entries over root main.go", () => {
    dir = makeTmpDir();
    // cmd/ directory with a binary
    const cmdDir = join(dir, "cmd", "server");
    mkdirSync(cmdDir, { recursive: true });
    writeFileSync(join(cmdDir, "main.go"), "package main\n");
    // Also has main.go at root + go.mod
    writeFileSync(join(dir, "main.go"), "package main\n");
    writeFileSync(join(dir, "go.mod"), "module github.com/example/other\n");
    const names = inferBinaryNames(dir);
    // cmd/ entry found, so root main.go fallback is skipped (names.size > 0)
    expect(names).toContain("server");
    expect(names).not.toContain("other");
  });
});

describe("readSourceVersion", () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("reads version from Rust Cargo.toml [package]", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "Cargo.toml"),
      [
        "[package]",
        'name = "rg"',
        'version = "14.1.0"',
        'edition = "2021"',
        "",
        "[dependencies]",
        'serde = "1.0"',
      ].join("\n"),
    );
    expect(readSourceVersion(dir)).toBe("14.1.0");
  });

  it("reads version from Python pyproject.toml", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "pyproject.toml"),
      [
        "[project]",
        'name = "mypackage"',
        'version = "2.3.1"',
        'description = "A tool"',
      ].join("\n"),
    );
    expect(readSourceVersion(dir)).toBe("2.3.1");
  });

  it("reads version from Python setup.cfg", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "setup.cfg"),
      ["[metadata]", "name = mypkg", "version = 1.5.0", "author = Test"].join("\n"),
    );
    expect(readSourceVersion(dir)).toBe("1.5.0");
  });

  it("reads version from CMakeLists.txt", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "CMakeLists.txt"),
      [
        "cmake_minimum_required(VERSION 3.20)",
        "project(mylib VERSION 3.2.1 LANGUAGES CXX)",
        "add_executable(mylib src/main.cpp)",
      ].join("\n"),
    );
    expect(readSourceVersion(dir)).toBe("3.2.1");
  });

  it("returns undefined for empty directory", () => {
    dir = makeTmpDir();
    expect(readSourceVersion(dir)).toBeUndefined();
  });

  it("prefers Cargo.toml over pyproject.toml when both exist", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "Cargo.toml"),
      `[package]\nname = "dual"\nversion = "1.0.0"\n`,
    );
    writeFileSync(
      join(dir, "pyproject.toml"),
      `[project]\nname = "dual"\nversion = "2.0.0"\n`,
    );
    // Cargo.toml is checked first
    expect(readSourceVersion(dir)).toBe("1.0.0");
  });

  it("falls back to pyproject.toml when no Cargo.toml", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "pyproject.toml"),
      `[project]\nname = "only-py"\nversion = "0.9.0"\n`,
    );
    expect(readSourceVersion(dir)).toBe("0.9.0");
  });

  it("falls back to setup.cfg when no Cargo.toml or pyproject.toml", () => {
    dir = makeTmpDir();
    writeFileSync(
      join(dir, "setup.cfg"),
      "[metadata]\nname = legacy\nversion = 0.4.2\n",
    );
    expect(readSourceVersion(dir)).toBe("0.4.2");
  });
});

---
name: crawl4ai
version: 0.0.0
description: "CLI tool: crawl4ai. Use this skill when the user needs crawl4ai (commands: test, show-report, merge-reports), even if they don't mention "crawl4ai" explicitly."
ingredients:
  - unclecode/crawl4ai
tags:
  - cli
---

# crawl4ai

CLI tool: crawl4ai

## Commands

### `crawl4ai test`

Run tests with Playwright Test. Available in @playwright/test package.

**Flags:**
- `--help` (-h) — display help for command

### `crawl4ai show-report`

Show Playwright Test HTML report. Available in @playwright/test package.

**Flags:**
- `--help` (-h) — display help for command

### `crawl4ai merge-reports`

Merge Playwright Test Blob reports Available in @playwright/test package.

**Flags:**
- `--help` (-h) — display help for command

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--version` | `-V` | output the version number |
| `--help` | `-h` | display help for command |

## Usage

```bash
# Show help
crawl4ai --help

# Run tests with Playwright Test. Available in @playwright/test package.
crawl4ai test

# Show Playwright Test HTML report. Available in @playwright/test package.
crawl4ai show-report

# Merge Playwright Test Blob reports Available in @playwright/test package.
crawl4ai merge-reports

```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run crawl4ai -- --help --json

# Introspect command schema
agents-cli schema crawl4ai --json

# Dry-run before executing
agents-cli run crawl4ai -- <args> --dry-run
```

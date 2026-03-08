---
name: devika
version: 0.0.0
description: "CLI tool: devika. Use this skill when the user needs devika (commands: test, show-report, merge-reports), even if they don't mention "devika" explicitly."
ingredients:
  - stitionai/devika
tags:
  - cli
---

# devika

CLI tool: devika

## Commands

### `devika test`

Run tests with Playwright Test. Available in @playwright/test package.

**Flags:**
- `--help` (-h) — display help for command

### `devika show-report`

Show Playwright Test HTML report. Available in @playwright/test package.

**Flags:**
- `--help` (-h) — display help for command

### `devika merge-reports`

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
devika --help

# Run tests with Playwright Test. Available in @playwright/test package.
devika test

# Show Playwright Test HTML report. Available in @playwright/test package.
devika show-report

# Merge Playwright Test Blob reports Available in @playwright/test package.
devika merge-reports

```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run devika -- --help --json

# Introspect command schema
agents-cli schema devika --json

# Dry-run before executing
agents-cli run devika -- <args> --dry-run
```

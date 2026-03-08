---
name: @playwright/test
version: 1.58.2
description: "CLI tool: @playwright/test. Use this skill when working with @playwright/test-related tasks."
ingredients:
  - @playwright/test
tags:
  - cli
---

# @playwright/test

CLI tool: @playwright/test

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--version` | `-V` | output the version number |
| `--help` | `-h` | display help for command |

## Usage

```bash
# Show help
@playwright/test --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @playwright/test -- --help --json

# Introspect command schema
agents-cli schema @playwright/test --json

# Dry-run before executing
agents-cli run @playwright/test -- <args> --dry-run
```

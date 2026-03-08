---
name: @redocly/cli
version: 2.20.4
description: "CLI tool: @redocly/cli. Use this skill when working with @redocly/cli-related tasks."
ingredients:
  - @redocly/cli
tags:
  - cli
---

# @redocly/cli

CLI tool: @redocly/cli

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--version` | — | Show version number.                                      [boolean] |
| `--help` | — | Show help.                                                [boolean] |

## Usage

```bash
# Show help
@redocly/cli --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @redocly/cli -- --help --json

# Introspect command schema
agents-cli schema @redocly/cli --json

# Dry-run before executing
agents-cli run @redocly/cli -- <args> --dry-run
```

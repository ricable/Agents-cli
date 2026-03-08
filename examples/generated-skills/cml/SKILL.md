---
name: cml
version: 0.20.6
description: "CLI tool: cml. Use this skill when working with cml-related tasks."
ingredients:
  - iterative/cml
tags:
  - cli
---

# cml

CLI tool: cml

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--log` | — | Logging verbosity |
| `--driver` | — | Git provider where the repository is hosted |
| `--repo` | — | Repository URL or slug |
| `--driver-token` | — |  |
| `--help` | — | Show help                                   [boolean] |
| `--version` | — | Show version number                                       [boolean] |

## Usage

```bash
# Show help
cml --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run cml -- --help --json

# Introspect command schema
agents-cli schema cml --json

# Dry-run before executing
agents-cli run cml -- <args> --dry-run
```

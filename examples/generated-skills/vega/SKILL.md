---
name: vega
version: 0.0.0
description: "CLI tool: vega. Use this skill when working with vega-related tasks."
ingredients:
  - vega/vega
tags:
  - cli
---

# vega

CLI tool: vega

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--base` | `-b` | Base directory for data loading. Defaults to the directory |
| `--loglevel` | `-l` | Level of log messages written to stderr. One of "error", |
| `--config` | `-c` | Vega config object. Either a JSON file or a .js file that |
| `--format` | `-f` | Number format locale descriptor. Either a JSON file or a .js |
| `--timeFormat` | `-t` | Date/time format locale descriptor. Either a JSON file or a |
| `--scale` | `-s` | Output resolution scale factor.        [number] [default: 1] |
| `--seed` | — | Seed for random number generation.                  [number] |
| `--test` | — | Disable default PDF metadata for test suites.      [boolean] |
| `--help` | — | Show help                                          [boolean] |
| `--version` | — | Show version number                                [boolean] |

## Usage

```bash
# Show help
vega --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run vega -- --help --json

# Introspect command schema
agents-cli schema vega --json

# Dry-run before executing
agents-cli run vega -- <args> --dry-run
```

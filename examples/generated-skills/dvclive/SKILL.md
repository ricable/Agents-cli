---
name: dvclive
version: 0.0.0
description: "CLI tool: dvclive. Use this skill when working with dvclive-related tasks."
ingredients:
  - iterative/dvclive
tags:
  - cli
---

# dvclive

CLI tool: dvclive

## Usage

```bash
# Show help
dvclive --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run dvclive -- --help --json

# Introspect command schema
agents-cli schema dvclive --json

# Dry-run before executing
agents-cli run dvclive -- <args> --dry-run
```

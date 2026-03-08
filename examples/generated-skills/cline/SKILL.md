---
name: cline
version: 3.71.0
description: "CLI tool: cline. Use this skill when working with cline-related tasks."
ingredients:
  - cline/cline
tags:
  - cli
---

# cline

CLI tool: cline

## Usage

```bash
# Show help
cline --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run cline -- --help --json

# Introspect command schema
agents-cli schema cline --json

# Dry-run before executing
agents-cli run cline -- <args> --dry-run
```
